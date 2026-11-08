package com.capturestudio.app

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.os.Binder
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.DisplayMetrics
import android.view.WindowManager
import java.io.File
import java.io.IOException

class ScreenRecordingService : Service() {

    private val binder = LocalBinder()
    private lateinit var notificationManager: RecordingNotificationManager
    private var mediaRecorder: MediaRecorder? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var mediaProjection: MediaProjection? = null

    private var outputFile: File? = null
    private var isRecording = false
    private var isPaused = false
    private var secondsElapsed = 0
    private val handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null

    var onStatusChangeListener: ((status: String) -> Unit)? = null
    var onTimeUpdateListener: ((seconds: Int) -> Unit)? = null

    inner class LocalBinder : Binder() {
        fun getService(): ScreenRecordingService = this@ScreenRecordingService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        notificationManager = RecordingNotificationManager(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            RecordingNotificationManager.ACTION_STOP -> {
                stopRecording()
            }
            RecordingNotificationManager.ACTION_PAUSE -> {
                pauseRecording()
            }
            RecordingNotificationManager.ACTION_RESUME -> {
                resumeRecording()
            }
        }
        return START_NOT_STICKY
    }

    fun startRecording(
        projection: MediaProjection,
        width: Int,
        height: Int,
        frameRate: Int,
        bitRate: Int,
        micEnabled: Boolean
    ): File {
        mediaProjection = projection

        // Android 14+ Foreground Service Start with specific types
        val notification = notificationManager.buildNotification(false, "00:00")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            var serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            if (micEnabled) {
                serviceType = serviceType or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                // Android 14
                startForeground(RecordingNotificationManager.NOTIFICATION_ID, notification, serviceType)
            } else {
                startForeground(RecordingNotificationManager.NOTIFICATION_ID, notification, serviceType)
            }
        } else {
            startForeground(RecordingNotificationManager.NOTIFICATION_ID, notification)
        }

        val windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        windowManager.defaultDisplay.getRealMetrics(metrics)

        // Setup MediaRecorder
        val timeStamp = System.currentTimeMillis()
        val dir = getExternalFilesDir("recordings") ?: filesDir
        outputFile = File(dir, "CaptureStudio_${timeStamp}.mp4")

        mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(this)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }

        mediaRecorder?.apply {
            if (micEnabled) {
                setAudioSource(MediaRecorder.AudioSource.MIC)
            }
            setVideoSource(MediaRecorder.VideoSource.SURFACE)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setVideoEncoder(MediaRecorder.VideoEncoder.H264)
            if (micEnabled) {
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(128000)
                setAudioSamplingRate(44100)
            }
            setVideoSize(width, height)
            setVideoFrameRate(frameRate)
            setVideoEncodingBitRate(bitRate)
            setOutputFile(outputFile?.absolutePath)

            try {
                prepare()
            } catch (e: IOException) {
                e.printStackTrace()
                throw e
            }
        }

        // Create VirtualDisplay
        virtualDisplay = projection.createVirtualDisplay(
            "CaptureStudioVirtualDisplay",
            width,
            height,
            metrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            mediaRecorder?.surface,
            null,
            null
        )

        mediaRecorder?.start()
        isRecording = true
        isPaused = false
        secondsElapsed = 0

        startTimer()
        onStatusChangeListener?.invoke("recording")

        return outputFile!!
    }

    fun pauseRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isRecording && !isPaused) {
            try {
                mediaRecorder?.pause()
                isPaused = true
                updateNotification()
                onStatusChangeListener?.invoke("paused")
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun resumeRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isRecording && isPaused) {
            try {
                mediaRecorder?.resume()
                isPaused = false
                updateNotification()
                onStatusChangeListener?.invoke("recording")
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun stopRecording(): File? {
        if (!isRecording) return outputFile

        isRecording = false
        isPaused = false
        stopTimer()

        try {
            mediaRecorder?.stop()
            mediaRecorder?.reset()
            mediaRecorder?.release()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        mediaRecorder = null

        virtualDisplay?.release()
        virtualDisplay = null

        mediaProjection?.stop()
        mediaProjection = null

        stopForeground(STOP_FOREGROUND_REMOVE)
        onStatusChangeListener?.invoke("idle")

        return outputFile
    }

    private fun startTimer() {
        timerRunnable = object : Runnable {
            override fun run() {
                if (isRecording && !isPaused) {
                    secondsElapsed++
                    onTimeUpdateListener?.invoke(secondsElapsed)
                    if (secondsElapsed % 5 == 0) {
                        updateNotification()
                    }
                }
                handler.postDelayed(this, 1000)
            }
        }
        handler.postDelayed(timerRunnable!!, 1000)
    }

    private fun stopTimer() {
        timerRunnable?.let { handler.removeCallbacks(it) }
        timerRunnable = null
    }

    private fun updateNotification() {
        val mins = secondsElapsed / 60
        val secs = secondsElapsed % 60
        val timeFormatted = String.format("%02d:%02d", mins, secs)
        val notification = notificationManager.buildNotification(isPaused, timeFormatted)
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        nm.notify(RecordingNotificationManager.NOTIFICATION_ID, notification)
    }

    fun isRecordingActive(): Boolean = isRecording
    fun getDurationSeconds(): Int = secondsElapsed

    override fun onDestroy() {
        super.onDestroy()
        stopRecording()
    }
}
