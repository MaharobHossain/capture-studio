package com.capturestudio.app

import android.graphics.SurfaceTexture
import android.opengl.GLES20
import android.view.Surface

/**
 * Helper for Compositing Screen VirtualDisplay and Camera Overlay onto a single EGL Surface
 */
class VideoCompositionEngine {

    data class BubbleBounds(
        val x: Float,
        val y: Float,
        val width: Float,
        val height: Float,
        val shape: String,
        val isMirrored: Boolean
    )

    fun calculateBubbleBounds(
        screenWidth: Int,
        screenHeight: Int,
        position: String,
        size: String,
        shape: String,
        mirror: Boolean
    ): BubbleBounds {
        val multiplier = when (size) {
            "sm" -> 0.18f
            "lg" -> 0.32f
            else -> 0.24f
        }

        val bubbleDim = screenHeight * multiplier
        val margin = screenHeight * 0.04f

        var bx = screenWidth - bubbleDim - margin
        var by = screenHeight - bubbleDim - margin

        when (position) {
            "bottom-left" -> {
                bx = margin
                by = screenHeight - bubbleDim - margin
            }
            "top-right" -> {
                bx = screenWidth - bubbleDim - margin
                by = margin
            }
            "top-left" -> {
                bx = margin
                by = margin
            }
        }

        return BubbleBounds(
            x = bx,
            y = by,
            width = bubbleDim,
            height = bubbleDim,
            shape = shape,
            isMirrored = mirror
        )
    }
}

