export interface BookingDTO {
  id: string;
  userId: string;
  ruanganId: string;
  purpose: string;
  audienceCount: number;
  startTime: string; // ISO Date
  endTime: string; // ISO Date
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_in' | 'completed';
  rejectionReason?: string | null;
  qrToken?: string | null;
  createdAt: string;
}

export type CreateBookingDTO = {
  ruanganId: string;
  purpose: string;
  audienceCount: number;
  startTime: string; // ISO Date String
  endTime: string; // ISO Date String
};

export type UpdateBookingStatusDTO = {
  status: 'approved' | 'rejected' | 'cancelled';
  rejectionReason?: string;
};
