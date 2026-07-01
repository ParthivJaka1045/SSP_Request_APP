import React from 'react';
import { useLocation } from 'react-router-dom';
import TechnicalRequestForm from '../TechnicalRequestForm';
import GenericModuleRequestForm from './GenericModuleRequestForm';
import { getModuleFromPath, MODULE_IDS } from '../../constants/modules';

export default function ModuleRequestPage() {
  const { pathname } = useLocation();
  const mod = getModuleFromPath(pathname);

  if (mod.id === MODULE_IDS.technical) {
    return <TechnicalRequestForm />;
  }
  return <GenericModuleRequestForm moduleId={mod.id} />;
}
