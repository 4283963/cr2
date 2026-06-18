/** GPS 轨迹控制器 */
import type { Request, Response } from 'express'
import { trajectoryService } from './trajectory.service.js'
import { ok, queryStr } from '../../utils/http.js'

export const trajectoryController = {
  trajectory(req: Request, res: Response): void {
    const points = trajectoryService.getTrajectory(
      req.params.id,
      queryStr(req.query.date),
    )
    ok(res, points)
  },
}
