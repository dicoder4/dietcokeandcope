/**
 * Camera.js — fixed-orientation camera + the fake-2.5D projection.
 *
 * Projection: cells are drawn as parallelograms skewed horizontally by a
 * small amount and given a top face + right face. No rotation, ever, so
 * the player always reads the world the same way.
 */

import { TILE_W, TILE_H } from './Grid.js'

export const SKEW = 0.34 // horizontal shear per row -> the "2.5D" tilt

export class Camera {
  constructor(viewW, viewH) {
    this.x = 0
    this.y = 0
    this.viewW = viewW
    this.viewH = viewH
    this.zoom = 1
    this.targetZoom = 1
    this.shake = 0
    this._shakeX = 0
    this._shakeY = 0
    /**
     * Cinematic override. While set, follow() ignores the player and eases
     * toward this point instead — that is how a beat "steals" the camera to
     * reveal the gap or push in on a face. release() hands it back.
     */
    this.focus = null // { x, y, zoom, ease }
  }

  /**
   * Point the camera at a world-space position (already projected) and hold
   * it there until release(). `ease` is the per-second convergence factor;
   * smaller = snappier.
   */
  focusOn(worldX, worldY, zoom = 1, ease = 0.004) {
    this.focus = { x: worldX, y: worldY, zoom, ease }
    this.targetZoom = zoom
  }

  release(zoom = 1) {
    this.focus = null
    this.targetZoom = zoom
  }

  /** True once a scripted move has essentially arrived. */
  focusSettled(tolerance = 6) {
    if (!this.focus) return true
    return (
      Math.hypot(this.focus.x - this.x, this.focus.y - this.y) < tolerance &&
      Math.abs(this.zoom - this.focus.zoom) < 0.02
    )
  }

  resize(w, h) {
    this.viewW = w
    this.viewH = h
  }

  /** World cell coords -> unprojected screen-space (before camera offset). */
  static project(cx, cy) {
    return {
      x: cx * TILE_W + cy * TILE_H * SKEW,
      y: cy * TILE_H,
    }
  }

  /** Screen point -> fractional world cell coords. Inverse of project(). */
  unproject(sx, sy) {
    const wx = (sx - this.viewW / 2) / this.zoom + this.x
    const wy = (sy - this.viewH / 2) / this.zoom + this.y
    const cy = wy / TILE_H
    const cx = (wx - cy * TILE_H * SKEW) / TILE_W
    return { cx, cy }
  }

  /**
   * Smoothly chase a world-space target point — unless a cinematic focus is
   * active, in which case that wins and the player target is ignored.
   */
  follow(targetWorldX, targetWorldY, dt, snap = false) {
    let tx = targetWorldX
    let ty = targetWorldY
    let ease = 0.0015
    if (this.focus) {
      tx = this.focus.x
      ty = this.focus.y
      ease = this.focus.ease
      this.targetZoom = this.focus.zoom
    }
    if (snap) {
      this.x = tx
      this.y = ty
      this.zoom = this.targetZoom
      return
    }
    const k = 1 - Math.pow(ease, dt)
    this.x += (tx - this.x) * k
    this.y += (ty - this.y) * k
    this.zoom += (this.targetZoom - this.zoom) * (1 - Math.pow(0.02, dt))
  }

  update(dt) {
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.4)
      const m = this.shake * 11
      this._shakeX = (Math.random() * 2 - 1) * m
      this._shakeY = (Math.random() * 2 - 1) * m
    } else {
      this._shakeX = this._shakeY = 0
    }
  }

  kick(amount = 1) {
    this.shake = Math.min(1.4, this.shake + amount)
  }

  /** Apply camera transform to a canvas context. */
  apply(ctx) {
    ctx.translate(this.viewW / 2, this.viewH / 2)
    ctx.scale(this.zoom, this.zoom)
    ctx.translate(-this.x + this._shakeX, -this.y + this._shakeY)
  }
}
