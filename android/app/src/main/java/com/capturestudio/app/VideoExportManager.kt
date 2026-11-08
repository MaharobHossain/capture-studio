package com.capturestudio.app

import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.media3.common.MediaItem
import androidx.media3.effect.ScaleAndRotateTransformation
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.ProgressHolder
import androidx.media3.transformer.Transformer
import java.io.File

class VideoExportManager(private val context: Context) {

    interface ExportCallback {
        fun onProgress(percentage: Int)
        fun onCompleted(outputFile: File)
        fun onError(error: Exception)
    }

    private var activeTransformer: Transformer? = null
    private val handler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null

    fun exportVideo(
        inputFile: File,
        outputFile: File,
        trimStartMs: Long = 0,
        trimEndMs: Long = -1,
        rotationDegrees: Float = 0f,
        callback: ExportCallback
    ) {
        val mediaItemBuilder = MediaItem.Builder()
            .setUri(Uri.fromFile(inputFile))

        if (trimEndMs > trimStartMs) {
            mediaItemBuilder.setClippingConfiguration(
                MediaItem.ClippingConfiguration.Builder()
                    .setStartPositionMs(trimStartMs)
                    .setEndPositionMs(trimEndMs)
                    .build()
            )
        }

        val mediaItem = mediaItemBuilder.build()

        val effectsList = mutableListOf<androidx.media3.common.Effect>()
        if (rotationDegrees != 0f) {
            effectsList.add(
                ScaleAndRotateTransformation.Builder()
                    .setRotationDegrees(rotationDegrees)
                    .build()
            )
        }

        val editedMediaItem = EditedMediaItem.Builder(mediaItem)
            .setEffects(Effects(listOf(), effectsList))
            .build()

        val transformerListener = object : Transformer.Listener {
            override fun onCompleted(composition: Composition, exportResult: ExportResult) {
                stopProgressPoller()
                callback.onCompleted(outputFile)
            }

            override fun onError(
                composition: Composition,
                exportResult: ExportResult,
                exportException: ExportException
            ) {
                stopProgressPoller()
                callback.onError(exportException)
            }
        }

        val transformer = Transformer.Builder(context)
            .addListener(transformerListener)
            .build()

        activeTransformer = transformer

        // Start transformer
        transformer.start(editedMediaItem, outputFile.absolutePath)

        // Poll progress
        startProgressPoller(transformer, callback)
    }

    private fun startProgressPoller(transformer: Transformer, callback: ExportCallback) {
        val progressHolder = ProgressHolder()
        progressRunnable = object : Runnable {
            override fun run() {
                val state = transformer.getProgress(progressHolder)
                if (state == Transformer.PROGRESS_STATE_AVAILABLE) {
                    callback.onProgress(progressHolder.progress)
                }
                if (state != Transformer.PROGRESS_STATE_NOT_STARTED) {
                    handler.postDelayed(this, 200)
                }
            }
        }
        handler.post(progressRunnable!!)
    }

    private fun stopProgressPoller() {
        progressRunnable?.let { handler.removeCallbacks(it) }
        progressRunnable = null
        activeTransformer = null
    }

    fun cancel() {
        activeTransformer?.cancel()
        stopProgressPoller()
    }
}

