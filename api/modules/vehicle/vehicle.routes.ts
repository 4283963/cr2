/** 车辆基础信息路由 */
import { Router } from 'express'
import { vehicleController } from './vehicle.controller.js'

const router = Router()

router.get('/', vehicleController.list)
router.get('/:id', vehicleController.detail)

export default router
