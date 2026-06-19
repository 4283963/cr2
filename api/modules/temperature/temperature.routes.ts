/** 多温区温度路由 */
import { Router } from 'express'
import { temperatureController } from './temperature.controller.js'

const router = Router()

router.get('/:id/temperatures', temperatureController.readings)
router.get('/:id/alerts', temperatureController.alerts)
router.get('/:id/spikes', temperatureController.spikes)

export default router
