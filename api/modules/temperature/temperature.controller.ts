/** 多温区温度控制器 */
import type { Request, Response } from 'express'
import { temperatureService } from './temperature.service.js'
import { ok, queryStr } from '../../utils/http.js'

export const temperatureController = {
  readings(req: Request, res: Response): void {
    const readings = temperatureService.getReadings(
      req.params.id,
      queryStr(req.query.date),
    )
    ok(res, readings)
  },

  alerts(req: Request, res: Response): void {
    const alerts = temperatureService.getAlerts(
      req.params.id,
      queryStr(req.query.date),
    )
    ok(res, alerts)
  },
}
