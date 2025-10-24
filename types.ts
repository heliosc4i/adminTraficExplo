export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMZONE = 'COMZONE',
}

export interface User {
  id: string; // Matricule
  username: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  zoneId?: string; 
  grade?: string;
}

export interface Zone {
  id: string;
  name: string;
}

export interface Station {
  id: string;
  name: string;
  zoneId: string;
}

export interface MessageStats {
  id: string;
  stationId: string;
  date: string;
  messagesSent: number;
  messagesReceived: number;
  submittedBy?: string; // User's matricule - Made optional
  zoneId: string;
}