export type DeliveryType = 'same_folder' | 'different_folder' | 'email' | 'both';

export interface ProcessingProfile {
  id: string;
  name: string;
  description: string | null;
  promptTemplate: string;
  deliveryType: DeliveryType;
  deliveryDestination: string | null;
  isActive: boolean;
  isTeam: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}
