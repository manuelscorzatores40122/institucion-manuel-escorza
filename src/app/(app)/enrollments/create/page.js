import { getActiveYear, getLevels, getAllYears } from '../actions';
import CreateEnrollmentClient from './CreateEnrollmentClient';

export const dynamic = 'force-dynamic';

export default async function CreateEnrollmentPage() {
  const activeYear = await getActiveYear();
  const allYears = await getAllYears();
  const levels = await getLevels();
  
  return <CreateEnrollmentClient activeYear={activeYear} allYears={allYears} levels={levels} />;
}
