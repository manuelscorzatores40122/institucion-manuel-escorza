import CreateStudentClient from './CreateStudentClient';
import { Suspense } from 'react';
import { getFilterOptions } from '../actions';

export default async function CreateStudentPage() {
  const options = await getFilterOptions();

  return (
    <Suspense fallback={<div>Cargando módulo de estudiante...</div>}>
      <CreateStudentClient options={options} />
    </Suspense>
  );
}
