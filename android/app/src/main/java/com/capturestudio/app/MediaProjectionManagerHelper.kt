package com.capturestudio.app

import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.Looper

class MediaProjectionManagerHelper(private val context: Context) {

    private val projectionManager: MediaProjectionManager =
        context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager

    private var activeMediaProjection: MediaProjection? = null
    var onProjectionStopListener: (() => Unit)? = null

    fun createScreenCaptureIntent(): Intent {
        return projectionManager.createScreenCaptureIntent()
    }

    fun initMediaProjection(resultCode: Int, data: Intent): MediaProjection {
        val projection = projectionManager.getMediaProjection(resultCode, data)
            ?: throw IllegalStateException("Failed to obtain MediaProjection from intent")

        // In Android 14 (API 34)+, you must register a Callback before creating a VirtualDisplay
        val callback = object : MediaProjection.Callback() {
            override fun onStop() {
                super.onStop()
                onProjectionStopListener?.invoke()
                activeMediaProjection = null
            }
        }

        projection.registerCallback(callback, Handler(Looper.getMainLooper()))
        activeMediaProjection = projection
        return projection
    }

    fun getActiveMediaProjection(): MediaProjection? {
        return activeMediaProjection
    }

    fun release() {
        try {
            activeMediaProjection?.stop()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        activeMediaProjection = null
    }
}

