/** 车辆基础信息控制器 */
import type { Request, Response } from 'express'
import { vehicleService } from './vehicle.service.js'
import { ok, fail, queryStr } from '../../utils/http.js'

export const vehicleController = {
  list(req: Request, res: Response): void {
    const status = queryStr(req.query.status)
    let summaries = vehicleService.listSummaries()
    if (status) {
      summaries = summaries.filter((v) => v.status === status)
    }
    ok(res, summaries)
  },

  detail(req: Request, res: Response): void {
    const detail = vehicleService.getDetail(req.params.id)
    if (!detail) {
      fail(res, 404, '车辆不存在')
      return
    }
    ok(res, detail)
  },
}
