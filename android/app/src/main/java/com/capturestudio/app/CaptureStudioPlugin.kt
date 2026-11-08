package com.capturestudio.app

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.graphics.Bitmap
import android.media.ThumbnailUtils
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.provider.MediaStore
import android.provider.Settings
import android.util.Base64
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.ByteArrayOutputStream
import java.io.File

@CapacitorPlugin(name = "CaptureStudio")
class CaptureStudioPlugin : Plugin() {

    private lateinit var projectionHelper: MediaProjectionManagerHelper
    private var recordingService: ScreenRecordingService? = null
    private var isBound = false
    private var pendingStartCall: PluginCall? = null
    private var pendingOptions: JSObject? = null
    private lateinit var exportManager: VideoExportManager

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as ScreenRecordingService.LocalBinder
            recordingService = binder.getService()
            isBound = true

            recordingService?.onStatusChangeListener = { status ->
                val data = JSObject().apply {
                    put("status", status)
                }
                notifyListeners("recordingStatusChange", data)
            }

            recordingService?.onTimeUpdateListener = { seconds ->
                val data = JSObject().apply {
                    put("duration", seconds)
                }
                notifyListeners("timeUpdate", data)
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            recordingService = null
            isBound = false
        }
    }

    override fun load() {
        super.load()
        projectionHelper = MediaProjectionManagerHelper(context)
        exportManager = VideoExportManager(context)

        // Bind to recording service
        val intent = Intent(context, ScreenRecordingService::class.java)
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    @PluginMethod
    fun startRecording(call: PluginCall) {
        pendingStartCall = call
        pendingOptions = call.data

        // Launch system screen-capture consent dialog
        val intent = projectionHelper.createScreenCaptureIntent()
        startActivityForResult(call, intent, "onScreenCaptureResult")
    }

    @ActivityCallback
    private fun onScreenCaptureResult(call: PluginCall?, result: ActivityResult) {
        val savedCall = pendingStartCall ?: call
        if (result.resultCode != Activity.RESULT_OK || result.data == null) {
            savedCall?.reject("Screen recording permission was denied by the user.")
            pendingStartCall = null
            return
        }

        try {
            val projection = projectionHelper.initMediaProjection(result.resultCode, result.data!!)
            val options = pendingOptions ?: JSObject()

            val resolution = options.getString("resolution", "1080p")
            val frameRate = options.getInteger("frameRate", 30)
            val micEnabled = options.getBoolean("micEnabled", true)
            val floatingEnabled = options.getBoolean("floatingControllerEnabled", true)

            val width: Int
            val height: Int
            val bitRate: Int

            when (resolution) {
                "4k" -> {
                    width = 3840; height = 2160; bitRate = 12000000
                }
                "1440p" -> {
                    width = 2560; height = 1440; bitRate = 8000000
                }
                "720p" -> {
                    width = 1280; height = 720; bitRate = 2500000
                }
                "480p" -> {
                    width = 854; height = 480; bitRate = 1500000
                }
                else -> { // 1080p
                    width = 1920; height = 1080; bitRate = 5000000
                }
            }

            recordingService?.startRecording(
                projection,
                width,
                height,
                frameRate,
                bitRate,
                micEnabled
            )

            // Start Floating Controller if requested and permission granted
            if (floatingEnabled && hasOverlayPermissionInternal()) {
                val floatIntent = Intent(context, FloatingControllerService::class.java)
                context.startService(floatIntent)
            }

            val response = JSObject().apply {
                put("success", true)
                put("sessionStarted", true)
            }
            savedCall?.resolve(response)
        } catch (e: Exception) {
            savedCall?.reject("Failed to initialize recording service: ${e.message}")
        } finally {
            pendingStartCall = null
        }
    }

    @PluginMethod
    fun pauseRecording(call: PluginCall) {
        recordingService?.pauseRecording()
        val ret = JSObject().apply { put("success", true) }
        call.resolve(ret)
    }

    @PluginMethod
    fun resumeRecording(call: PluginCall) {
        recordingService?.resumeRecording()
        val ret = JSObject().apply { put("success", true) }
        call.resolve(ret)
    }

    @PluginMethod
    fun stopRecording(call: PluginCall) {
        // Stop floating controller service
        val floatIntent = Intent(context, FloatingControllerService::class.java)
        context.stopService(floatIntent)

        val duration = recordingService?.getDurationSeconds() ?: 0
        val outputFile = recordingService?.stopRecording()
        projectionHelper.release()

        if (outputFile != null && outputFile.exists()) {
            val thumbnailBase64 = generateVideoThumbnailBase64(outputFile)

            val ret = JSObject().apply {
                put("success", true)
                put("filePath", outputFile.absolutePath)
                put("duration", duration)
                put("fileSize", outputFile.length())
                put("resolution", "1080p Full HD")
                put("format", "mp4")
                put("thumbnailBase64", thumbnailBase64)
            }
            call.resolve(ret)
        } else {
            call.reject("Recording failed or output file is empty")
        }
    }

    @PluginMethod
    fun getRecordingState(call: PluginCall) {
        val isActive = recordingService?.isRecordingActive() ?: false
        val duration = recordingService?.getDurationSeconds() ?: 0
        val ret = JSObject().apply {
            put("status", if (isActive) "recording" else "idle")
            put("duration", duration)
            put("isFloatingActive", FloatingControllerService.isRunning)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun requestOverlayPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            )
            activity.startActivity(intent)
            call.resolve(JSObject().apply { put("granted", false) })
        } else {
            call.resolve(JSObject().apply { put("granted", true) })
        }
    }

    @PluginMethod
    fun hasOverlayPermission(call: PluginCall) {
        val granted = hasOverlayPermissionInternal()
        call.resolve(JSObject().apply { put("granted", granted) })
    }

    private fun hasOverlayPermissionInternal(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    @PluginMethod
    fun toggleFloatingController(call: PluginCall) {
        val enable = call.getBoolean("enabled", true) ?: true
        val floatIntent = Intent(context, FloatingControllerService::class.java)
        if (enable && hasOverlayPermissionInternal()) {
            context.startService(floatIntent)
        } else {
            context.stopService(floatIntent)
        }
        call.resolve(JSObject().apply { put("success", true) })
    }

    @PluginMethod
    fun exportVideo(call: PluginCall) {
        val sourcePath = call.getString("sourcePath")
        val outputPath = call.getString("outputPath")
        val trimStart = call.getDouble("trimStart", 0.0) ?: 0.0
        val trimEnd = call.getDouble("trimEnd", -1.0) ?: -1.0
        val rotation = call.getDouble("rotation", 0.0)?.toFloat() ?: 0f

        if (sourcePath == null || outputPath == null) {
            call.reject("sourcePath and outputPath are required")
            return
        }

        val inputFile = File(sourcePath)
        val outputFile = File(outputPath)

        exportManager.exportVideo(
            inputFile,
            outputFile,
            (trimStart * 1000).toLong(),
            if (trimEnd > 0) (trimEnd * 1000).toLong() else -1,
            rotation,
            object : VideoExportManager.ExportCallback {
                override fun onProgress(percentage: Int) {
                    val data = JSObject().apply {
                        put("progress", percentage)
                    }
                    notifyListeners("exportProgress", data)
                }

                override fun onCompleted(outputFile: File) {
                    val ret = JSObject().apply {
                        put("success", true)
                        put("outputPath", outputFile.absolutePath)
                    }
                    call.resolve(ret)
                }

                override fun onError(error: Exception) {
                    call.reject("Export failed: ${error.message}")
                }
            }
        )
    }

    private fun generateVideoThumbnailBase64(file: File): String {
        return try {
            val bitmap = ThumbnailUtils.createVideoThumbnail(
                file.absolutePath,
                MediaStore.Images.Thumbnails.MINI_KIND
            )
            if (bitmap != null) {
                val stream = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
                val byteArray = stream.toByteArray()
                "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)
            } else {
                ""
            }
        } catch (e: Exception) {
            ""
        }
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        if (isBound) {
            context.unbindService(serviceConnection)
            isBound = false
        }
        projectionHelper.release()
    }
}
