/** GPS 轨迹路由 */
import { Router } from 'express'
import { trajectoryController } from './trajectory.controller.js'

const router = Router()

router.get('/:id/trajectory', trajectoryController.trajectory)

export default router
