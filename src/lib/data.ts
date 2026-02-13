
import { collection, getDocs, addDoc, doc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import type { Client, Equipment, ServiceOrder, InspectionChecklist } from "@/types";


// --- CLIENTS ---
export const getClients = async (includeArchived = false): Promise<Client[]> => {
  try {
    const clientQuery = query(collection(db, "clients"));
    const querySnapshot = await getDocs(clientQuery);
    const clients: Client[] = [];
    querySnapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() } as Client);
    });
    
    if (includeArchived) {
        return clients;
    }

    // Filter in code to include clients without status field
    return clients.filter(client => (client as any).status !== 'archived');
  } catch (error) {
    console.error("Error fetching clients: ", error);
    return [];
  }
};

export const saveClient = async (client: Omit<Client, 'id'> & { id?: string }): Promise<Client> => {
  const clientToSave = { ...client, status: (client as any).status || 'active' };
  
  if (client.id) {
    const docRef = doc(db, "clients", client.id);
    await setDoc(docRef, clientToSave, { merge: true });
    return { ...clientToSave, id: client.id };
  } else {
    // remove id before adding new doc
    const { id, ...clientData } = clientToSave;
    const docRef = await addDoc(collection(db, "clients"), clientData);
    return { ...clientData, id: docRef.id };
  }
};

export const archiveClient = async (clientId: string): Promise<void> => {
    if (!clientId) {
      console.error("Error: Invalid clientId provided for archiving.");
      throw new Error("Invalid ID for archiving");
    }
    try {
        const clientRef = doc(db, "clients", clientId);
        await updateDoc(clientRef, { status: "archived" });
    } catch (error) {
        console.error("Error archiving client: ", error);
        throw error;
    }
};

export const restoreClient = async (clientId: string): Promise<void> => {
    if (!clientId) throw new Error("Invalid ID for restoring");
    const clientRef = doc(db, "clients", clientId);
    await updateDoc(clientRef, { status: "active" });
};

export const deleteClientPermanently = async (clientId: string): Promise<void> => {
    if (!clientId) throw new Error("Invalid ID for permanent deletion");
    const clientRef = doc(db, "clients", clientId);
    await deleteDoc(clientRef);
};


// --- EQUIPMENT ---
export const getEquipment = async (includeArchived = false): Promise<Equipment[]> => {
  try {
    const equipmentQuery = query(collection(db, "equipment"));
    const querySnapshot = await getDocs(equipmentQuery);
    const equipment: Equipment[] = [];
    querySnapshot.forEach((doc) => {
        equipment.push({ id: doc.id, ...doc.data() } as Equipment);
    });

    if (includeArchived) {
        return equipment;
    }

    return equipment.filter(eq => (eq as any).status !== 'archived');
   } catch (error) {
    console.error("Error fetching equipment: ", error);
    return [];
  }
};

export const saveEquipment = async (equipmentData: Omit<Equipment, 'id'> & { id?: string }): Promise<Equipment> => {
    const equipmentToSave = { ...equipmentData, status: (equipmentData as any).status || 'active' };
    if (equipmentData.id) {
        const docRef = doc(db, "equipment", equipmentData.id);
        await setDoc(docRef, equipmentToSave, { merge: true });
        return { ...equipmentToSave, id: equipmentData.id };
    } else {
        const { id, ...newEquipmentData } = equipmentToSave;
        const docRef = await addDoc(collection(db, "equipment"), newEquipmentData);
        return { ...newEquipmentData, id: docRef.id };
    }
};

export const archiveEquipment = async (equipmentId: string): Promise<void> => {
    if (!equipmentId) throw new Error("Invalid ID for archiving");
    const equipmentRef = doc(db, "equipment", equipmentId);
    await updateDoc(equipmentRef, { status: "archived" });
};

export const restoreEquipment = async (equipmentId: string): Promise<void> => {
    if (!equipmentId) throw new Error("Invalid ID for restoring");
    const equipmentRef = doc(db, "equipment", equipmentId);
    await updateDoc(equipmentRef, { status: "active" });
};

export const deleteEquipmentPermanently = async (equipmentId: string): Promise<void> => {
    if (!equipmentId) throw new Error("Invalid ID for permanent deletion");
    const equipmentRef = doc(db, "equipment", equipmentId);
    await deleteDoc(equipmentRef);
};


export const equipmentTypes = {
    flex_endoscope: "Endoscópio Flexível",
    rigid_endoscope: "Endoscópio Rígido",
    colonoscope: "Colonoscópio",
    gastroscope: "Gastroscópio",
    processor: "Processadora de Imagem",
    light_source: "Fonte de Luz",
    other: "Outro",
};

export const equipmentTechnicalStatusValues = {
    in_use: "Em Uso",
    in_maintenance: "Em Manutenção",
    waiting_parts: "Aguardando Peça",
    ready_for_delivery: "Pronto para Entrega",
};


// --- SERVICE ORDERS ---
export const getServiceOrders = async (includeArchived = false): Promise<ServiceOrder[]> => {
  try {
    let orderQuery;
    if (includeArchived) {
        orderQuery = query(collection(db, "serviceOrders"));
    } else {
        orderQuery = query(collection(db, "serviceOrders"), where("status", "!=", "Arquivada"));
    }
    const querySnapshot = await getDocs(orderQuery);
    const orders: ServiceOrder[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({ 
            id: doc.id, 
            ...data,
            budget: data.budget || { items: [] } 
        } as ServiceOrder);
    });
    return orders.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  } catch (error) {
      console.error("Error fetching service orders: ", error);
      return [];
  }
};

export const saveServiceOrder = async (order: Omit<ServiceOrder, 'id' | 'readableId'> & { id?: string; readableId?: string }): Promise<ServiceOrder> => {
  
  const cleanOrder = { ...order };
  if (cleanOrder.inspectionChecklist) {
    for (const key in cleanOrder.inspectionChecklist) {
      const item = cleanOrder.inspectionChecklist[key as keyof InspectionChecklist];
      if (item && item.observation === undefined) {
        item.observation = ''; 
      }
    }
  }

  if (cleanOrder.id) {
    const docRef = doc(db, "serviceOrders", cleanOrder.id);
    const { id, ...orderData } = cleanOrder;
    await setDoc(docRef, orderData, { merge: true });
    return { ...orderData, id: docRef.id, readableId: cleanOrder.readableId! };
  } else {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const q = query(collection(db, "serviceOrders"), where("entryDate", ">=", startOfMonth.toISOString().split('T')[0]));
    const querySnapshot = await getDocs(q);
    const sequence = querySnapshot.size + 1;
    
    const readableId = `OS-${year}${month}-${String(sequence).padStart(4, '0')}`;
    
    const { id, ...orderData } = cleanOrder;
    const orderWithId = { ...orderData, readableId: readableId };
    
    const docRef = await addDoc(collection(db, "serviceOrders"), orderWithId);
    return { ...orderWithId, id: docRef.id };
  }
};


export const archiveServiceOrder = async (orderId: string): Promise<void> => {
    if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
        console.error("Error: Invalid or empty orderId provided for archiving.", orderId);
        throw new Error("Invalid or empty ID for archiving");
    }
    try {
        const orderRef = doc(db, "serviceOrders", orderId);
        await updateDoc(orderRef, { status: "Arquivada" });
    } catch (error) {
        console.error("Error archiving service order: ", error);
        throw error;
    }
};

export const restoreServiceOrder = async (orderId: string): Promise<void> => {
    if (!orderId) throw new Error("Invalid ID for restoring");
    const orderRef = doc(db, "serviceOrders", orderId);
    await updateDoc(orderRef, { status: "Aberta" }); // Default status on restore
};

export const deleteServiceOrderPermanently = async (orderId: string): Promise<void> => {
    if (!orderId) throw new Error("Invalid ID for permanent deletion");
    const orderRef = doc(db, "serviceOrders", orderId);
    await deleteDoc(orderRef);
};
