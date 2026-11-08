package com.capturestudio.app

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class FloatingControllerService : Service() {

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var timerTextView: TextView? = null
    private var pauseResumeBtn: Button? = null
    private var isPaused = false

    private val handler = Handler(Looper.getMainLooper())
    private var secondsElapsed = 0
    private var timerRunnable: Runnable? = null

    companion object {
        var isRunning = false
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        if (canDrawOverlays()) {
            initFloatingView()
            startTimer()
        } else {
            stopSelf()
        }
    }

    private fun canDrawOverlays(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    private fun initFloatingView() {
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 100
            y = 200
        }

        // Programmatically build a dark pill with #00E632 brand accent
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(32, 16, 32, 16)
            background = GradientDrawable().apply {
                setColor(0xEE101310.toInt())
                cornerRadius = 80f
                setStroke(3, 0xFF00E632.toInt())
            }
        }

        // Live dot indicator
        val dot = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(24, 24).apply {
                marginEnd = 16
            }
            background = GradientDrawable().apply {
                setColor(0xFF00E632.toInt())
                shape = GradientDrawable.OVAL
            }
        }
        container.addView(dot)

        // Timer TextView
        timerTextView = TextView(this).apply {
            text = "00:00"
            setTextColor(Color.WHITE)
            textSize = 14f
            typeface = Typeface.MONOSPACE
            setPadding(0, 0, 24, 0)
        }
        container.addView(timerTextView)

        // Pause/Resume Button
        pauseResumeBtn = Button(this).apply {
            text = "Pause"
            setTextColor(Color.WHITE)
            textSize = 11f
            background = GradientDrawable().apply {
                setColor(0xFF1A201A.toInt())
                cornerRadius = 30f
                setStroke(2, 0xFF283128.toInt())
            }
            setOnClickListener {
                togglePauseResume()
            }
        }
        container.addView(pauseResumeBtn)

        // Stop Button
        val stopBtn = Button(this).apply {
            text = "Stop"
            setTextColor(Color.WHITE)
            textSize = 11f
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginStart = 12
            }
            background = GradientDrawable().apply {
                setColor(0xFFEF4444.toInt())
                cornerRadius = 30f
            }
            setOnClickListener {
                stopRecording()
            }
        }
        container.addView(stopBtn)

        // Touch Dragging Listener
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        container.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager?.updateViewLayout(floatingView, params)
                    true
                }
                else -> false
            }
        }

        floatingView = container
        windowManager?.addView(floatingView, params)
    }

    private fun startTimer() {
        timerRunnable = object : Runnable {
            override fun run() {
                if (!isPaused) {
                    secondsElapsed++
                    val mins = secondsElapsed / 60
                    val secs = secondsElapsed % 60
                    timerTextView?.text = String.format("%02d:%02d", mins, secs)
                }
                handler.postDelayed(this, 1000)
            }
        }
        handler.postDelayed(timerRunnable!!, 1000)
    }

    private fun togglePauseResume() {
        isPaused = !isPaused
        pauseResumeBtn?.text = if (isPaused) "Resume" else "Pause"

        val intent = Intent(this, ScreenRecordingService::class.java).apply {
            action = if (isPaused) RecordingNotificationManager.ACTION_PAUSE else RecordingNotificationManager.ACTION_RESUME
        }
        startService(intent)
    }

    private fun stopRecording() {
        val intent = Intent(this, ScreenRecordingService::class.java).apply {
            action = RecordingNotificationManager.ACTION_STOP
        }
        startService(intent)
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        timerRunnable?.let { handler.removeCallbacks(it) }
        floatingView?.let {
            windowManager?.removeView(it)
            floatingView = null
        }
    }
}

