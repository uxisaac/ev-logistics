export interface Alert {
  id: string
  vehicleId: string
  model: string
  driver: string
  alertTitle: string
  alertDetail: string
  riskLabel: string
  batteryPct: number
  severity: 'critical' | 'warning'
  unreadMessages: number
  coordinates: [number, number]
}

export const ALERTS: Alert[] = [
  { id: '1', vehicleId: 'VH-0041', model: 'Ford E-Transit', driver: 'M. Torres', alertTitle: 'Needs charging after route end', alertDetail: 'EST. RANGE 12 MI · ROUTE HAS 28 MI REMAINING', riskLabel: '+45MIN RISK', batteryPct: 14, severity: 'critical', unreadMessages: 3, coordinates: [-122.412, 37.778] },
  { id: '2', vehicleId: 'VH-0089', model: 'BYD eBus-12', driver: 'S. Kim', alertTitle: 'Needs charging after route end', alertDetail: 'EST. RANGE 8 MI · ROUTE HAS 22 MI REMAINING', riskLabel: '+30MIN RISK', batteryPct: 9, severity: 'critical', unreadMessages: 0, coordinates: [-122.271, 37.804] },
  { id: '3', vehicleId: 'VH-0023', model: 'Mercedes eSprinter', driver: 'R. Patel', alertTitle: 'Charging session failed', alertDetail: 'STATION CH-04 · LAST ATTEMPT 14 MIN AGO', riskLabel: 'DEPARTING IN 2H', batteryPct: 31, severity: 'warning', unreadMessages: 7, coordinates: [-122.270, 37.871] },
  { id: '4', vehicleId: 'VH-0112', model: 'Ford E-Transit', driver: 'L. Chen', alertTitle: 'Needs charging after route end', alertDetail: 'EST. RANGE 18 MI · ROUTE HAS 31 MI REMAINING', riskLabel: '+60MIN RISK', batteryPct: 17, severity: 'critical', unreadMessages: 0, coordinates: [-122.428, 37.654] },
  { id: '5', vehicleId: 'VH-0067', model: 'Rivian EDV', driver: 'A. Okafor', alertTitle: 'Telematics signal lost', alertDetail: 'LAST SEEN 47 MIN AGO · ZONE 3 EAST', riskLabel: 'UNTRACKED', batteryPct: 62, severity: 'warning', unreadMessages: 0, coordinates: [-122.241, 37.765] },
  { id: '6', vehicleId: 'VH-0055', model: 'BYD eBus-12', driver: 'J. Martinez', alertTitle: 'Needs charging after route end', alertDetail: 'EST. RANGE 6 MI · ROUTE HAS 19 MI REMAINING', riskLabel: '+20MIN RISK', batteryPct: 7, severity: 'critical', unreadMessages: 2, coordinates: [-122.351, 37.936] },
  { id: '7', vehicleId: 'VH-0098', model: 'Mercedes eSprinter', driver: 'T. Williams', alertTitle: 'Driver check-in overdue', alertDetail: 'EXPECTED AT 05:45 AM · LAST PING 52 MIN AGO', riskLabel: '+45MIN LATE', batteryPct: 78, severity: 'warning', unreadMessages: 0, coordinates: [-122.469, 37.679] },
  { id: '8', vehicleId: 'VH-0034', model: 'Rivian EDV', driver: 'P. Johnson', alertTitle: 'Needs charging after route end', alertDetail: 'EST. RANGE 21 MI · ROUTE HAS 35 MI REMAINING', riskLabel: '+55MIN RISK', batteryPct: 19, severity: 'critical', unreadMessages: 0, coordinates: [-122.325, 37.562] },
  { id: '9', vehicleId: 'VH-0076', model: 'Ford E-Transit', driver: 'D. Nguyen', alertTitle: 'Charging session failed', alertDetail: 'STATION CH-11 · LAST ATTEMPT 28 MIN AGO', riskLabel: 'DEPARTING IN 3H', batteryPct: 24, severity: 'warning', unreadMessages: 5, coordinates: [-121.989, 37.548] },
]
