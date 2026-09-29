import CropDashboardLayout from '../monitoring/shared/CropDashboardLayout';
import { SERVICE_CATALOG } from './serviceCatalog';
import 'leaflet/dist/leaflet.css';

/**
 * A sustainability, field-advisory or finance service. Same layout as
 * organisation monitoring; the catalogue entry decides the sub-pages.
 */
const ServicePortal = ({ moduleId, onBack, onSignOut }) => (
  <CropDashboardLayout
    key={moduleId}
    mode="organization"
    service={{ id: moduleId, ...SERVICE_CATALOG[moduleId] }}
    onBack={onBack}
    onSignOut={onSignOut}
  />
);

export default ServicePortal;
