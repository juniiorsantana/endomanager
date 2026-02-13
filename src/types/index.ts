
import type { Marker } from "@/components/dashboard/image-inspection-canvas";

export type ServiceOrderStatus =
  | "Aberta"
  | "Em Diagnóstico"
  | "Aguardando Aprovação"
  | "Em Andamento"
  | "Finalizada"
  | "Entregue"
  | "Arquivada";

export type Client = {
  id: string;
  clientType: "fisica" | "juridica";
  companyName: string;
  contactName: string;
  cpf?: string;
  cnpj?: string;
  phone: string;
  email: string;
  address: string;
  observations?: string;
  status?: 'active' | 'archived';
};

export type EquipmentAvailabilityType = 'internal' | 'sale' | 'rent';

export type EquipmentSaleStatus = 'available' | 'sold';

export type EquipmentRentalStatus = 'available' | 'rented';

export type EquipmentTechnicalStatus = 'in_use' | 'in_maintenance' | 'waiting_parts' | 'ready_for_delivery';

export type Equipment = {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  acquisitionDate?: string;
  ownerId: string; // The legal owner of the equipment
  equipmentType: string;
  technicalStatus: EquipmentTechnicalStatus;
  technicalObservations?: string;
  status?: 'active' | 'archived';

  availabilityType: EquipmentAvailabilityType;

  // Fields for equipment for sale
  salePrice?: number;
  saleStatus?: EquipmentSaleStatus;
  saleDate?: string;
  buyerId?: string; // Links to a client

  // Fields for equipment for rent
  rentalPrice?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  rentalStatus?: EquipmentRentalStatus;
  rentalClientId?: string; // The client who is currently renting
  rentalStartDate?: string;
  rentalExpectedReturnDate?: string;
  rentalActualReturnDate?: string;
};

export type BudgetItem = {
    id?: number;
    description: string;
    quantity: number;
    unitPrice: number;
};

export type BudgetStatus = "Pendente" | "Aprovado" | "Reprovado";

export type InspectionChecklistItemStatus = 'OK' | 'Defeito' | 'Troca';

export const inspectionItems = {
  command: "Comando/Mecânica",
  tubes: "Tubos e Canais",
  buttons: "Botões e Lentes",
  image: "Imagem",
  setup: "Setup/Conexões",
  lighting: "Iluminação",
  accessories: "Acessórios"
};

export type InspectionChecklistItem = {
  status: InspectionChecklistItemStatus;
  observation?: string;
};

export type InspectionChecklist = {
  [key in keyof typeof inspectionItems]?: InspectionChecklistItem;
};


export type VisualInspectionData = {
    generalObservations: string;
    markers: Marker[];
}

export type ServiceOrder = {
  id: string; // Firestore document ID
  readableId: string; // Human-readable ID like OS-2024-001
  entryDate: string;
  exitDate?: string;
  problemDescription: string;
  status: ServiceOrderStatus;
  clientId: string;
  equipmentId: string;
  technicianNotes?: string;
  inspectionChecklist?: InspectionChecklist;
  visualInspection?: VisualInspectionData;
  budget?: {
    items: BudgetItem[];
    paymentMethod?: string;
    observations?: string;
    status?: BudgetStatus;
  };
  execution?: {
    technician?: string;
    procedures?: string;
    completionDate?: string;
  };
  delivery?: {
    deliveryDate?: string;
    finalObservations?: string;
  }
};
