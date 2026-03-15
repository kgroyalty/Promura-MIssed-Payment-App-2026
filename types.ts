
export enum DeescalationStage {
  GRACE_PERIOD = '3-Day Grace Period',
  WARNING_SENT = 'Warning Issued',
  CHATTERS_REMOVED = 'Chatters Removed',
  CONTENT_LOCKED = 'Content Locked',
  ACCOUNT_DISABLED = 'Account Disabled',
  PAID = 'Paid'
}

export enum IssueType {
  MELON_DISCONNECT = 'Melon Disconnection',
  INSUFFICIENT_FUNDS = 'Insufficient Funds',
  SYSTEM_GLITCH = 'System Issue',
  PAYMENT_FAILED = 'Payment Failed',
  PARTIAL_CHARGE = 'Partial Charge',
  OTHER = 'Other'
}

export enum ManualPaymentMethod {
  APPLE_PAY = 'Apple Pay (480-565-9837)',
  ZELLE = 'Zelle (Beastfitnation1@gmail.com)',
  MELON_DIRECT = 'Melon Direct Settlement',
  WIRE = 'Wire Transfer'
}

export interface ReliabilityBreakdown {
  onTimeRate: number;
  avgDelayDays: number;
  recoveryRatio: number;
  consistencyScore: number;
  resolutionSpeed: number;
}

export interface Creator {
  id: string;
  realName: string;
  stageName: string;
  phoneNumber: string;
  email: string;
  reliabilityScore: number;
  reliabilityBreakdown?: ReliabilityBreakdown;
  totalPaid: number;
  totalMissed: number;
  status: 'active' | 'inactive';
  paymentHistory: PaymentTrack[];
  notes?: string;
  melonSplitId: string;
  splitPercentage: number;
  bankStatus: 'linked' | 'unlinked' | 'pending';
  lastSuccessfulPaymentDate: string | null;
  onlyFansUsername?: string;
  createdDate: string;
  recentPayments?: MelonPaymentRecord[];
}

export interface PaymentTrack {
  id: string;
  creatorId: string;
  amountOwed: number;
  daysDelayed: number;
  currentStage: DeescalationStage;
  logs: ActivityLog[];
  issueType?: IssueType;
  resolvedAt?: string;
  paymentMethod?: ManualPaymentMethod;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'automation' | 'admin' | 'creator';
  image?: string;
}

// API Payload from Apify Melon Scraper
export interface MelonSyncPayload {
  run_id: string;
  sync_timestamp: string;
  agency_name: string;
  summary: {
    total_creators: number;
    active_creators: number;
    pending_creators: number;
    total_risk_capital: number;
    next_payout_amount: number;
    creators_with_issues: number;
  };
  creators: MelonCreatorData[];
}

export interface MelonCreatorData {
  melon_split_id: string;
  name: string;
  bank_status: 'linked' | 'unlinked' | 'pending';
  split_percentage: number;
  current_balance: number;
  processing_amount: number;
  has_warning: boolean;
  has_red_banner: boolean;
  last_successful_payment_date: string | null;
  days_since_last_payment: number;
  recent_payments: MelonPaymentRecord[];
  failure_count: number;
  total_failed_amount: number;
  issue_type: string;
}

export interface MelonPaymentRecord {
  payout_date: string;
  initiator_paid: number;
  agency_earnings: number;
  status: 'PROCESSED' | 'PROCESSING' | 'FAILED' | 'NSF';
  processing: boolean;
  eta?: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'failed' | 'partial';
  recordsProcessed: number;
  newIssuesDetected: number;
}

export interface AppState {
  creators: Creator[];
  activeTracks: PaymentTrack[];
  notifications: string[];
  melonRecords: MelonPaymentRecord[];
  lastSyncedAt: string;
}

export const getStageFromDays = (days: number, isPaid: boolean = false): DeescalationStage => {
  if (isPaid) return DeescalationStage.PAID;
  if (days >= 12) return DeescalationStage.ACCOUNT_DISABLED;
  if (days >= 9) return DeescalationStage.CONTENT_LOCKED;
  if (days >= 6) return DeescalationStage.CHATTERS_REMOVED;
  if (days >= 4) return DeescalationStage.WARNING_SENT;
  return DeescalationStage.GRACE_PERIOD;
};

export const STAGE_THRESHOLDS = [
  { day: 0, stage: DeescalationStage.GRACE_PERIOD },
  { day: 4, stage: DeescalationStage.WARNING_SENT },
  { day: 6, stage: DeescalationStage.CHATTERS_REMOVED },
  { day: 9, stage: DeescalationStage.CONTENT_LOCKED },
  { day: 12, stage: DeescalationStage.ACCOUNT_DISABLED }
];
