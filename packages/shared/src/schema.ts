// Main schema exports - this file is imported as '@shared/schema'
export * from './db/pg-schema';

// Import types for use in this file
import type { Equipment } from './db/pg-schema';

// Re-export commonly used types
export type {
  AstroImage,
  InsertAstroImage,
  Equipment,
  InsertEquipment,
  ImageEquipment,
  InsertImageEquipment,
  PlateSolvingJob,
  InsertPlateSolvingJob,
  Location,
  InsertLocation,
  ImageAcquisitionRow,
  InsertImageAcquisitionRow,
} from './db/pg-schema';

// Re-export equipment types and config
export type {
  EquipmentType,
  EquipmentSpecifications,
  TelescopeSpecifications,
  CameraSpecifications,
  MountSpecifications,
  FilterSpecifications,
  SpecFieldDefinition,
} from './types/index';

export { EQUIPMENT_SPEC_FIELDS } from './types/index';

// Equipment with details type (for UI components)
export type EquipmentWithDetails = Equipment;
