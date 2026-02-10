export interface Student {
  id: string;
  name: string;
  groupKey?: string;
}

export interface ClassType {
  id: string;
  name: string;
  price: number;
  studentIds?: string[];
}

export interface AttendanceSession {
  id: string;
  date: string;
  classTypeId: string;
  studentIds: string[];
}

export interface HistoryMonth {
  id: string;
  monthName: string;
  year: number;
  sessions: AttendanceSession[];
  revenue: number;
  recordedAt: string;
}

export interface Profile {
  businessName: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  logo?: string;
}

export interface AppState {
  students: Student[];
  classTypes: ClassType[];
  sessions: AttendanceSession[];
  history: HistoryMonth[];
  profile: Profile;
  theme: 'light' | 'dark';
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  REGISTER = 'REGISTER',
  ROSTER = 'ROSTER',
  INVOICES = 'INVOICES',
  HISTORY = 'HISTORY',
  STATISTICS = 'STATISTICS'
}