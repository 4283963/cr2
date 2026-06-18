/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import vehicleRoutes from './modules/vehicle/vehicle.routes.js'
import trajectoryRoutes from './modules/trajectory/trajectory.routes.js'
import temperatureRoutes from './modules/temperature/temperature.routes.js'
import { seedStore } from './store/seed.js'

// load env
dotenv.config()

// 初始化内存仓储(mock 种子数据)
seedStore()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 * 三个业务模块均挂载在 /api/vehicles 下:
 *  - 车辆基础信息: GET / , GET /:id
 *  - GPS 轨迹:    GET /:id/trajectory
 *  - 多温区温度:  GET /:id/temperatures , GET /:id/alerts
 */
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/vehicles', trajectoryRoutes)
app.use('/api/vehicles', temperatureRoutes)

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'ok' })
})

/**
 * error handler middleware
 */
app.use(
  (error: Error, req: Request, res: Response, next: NextFunction): void => {
    res.status(500).json({ success: false, error: 'Server internal error' })
  },
)

/**
 * 404 handler
 */
app.use((req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
