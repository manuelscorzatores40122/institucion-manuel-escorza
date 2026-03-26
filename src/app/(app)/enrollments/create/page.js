import { getActiveYear, getLevels } from '../actions';
import CreateEnrollmentClient from './CreateEnrollmentClient';

export default async function CreateEnrollmentPage() {
  const activeYear = await getActiveYear();
  const levels = await getLevels();
  
  return <CreateEnrollmentClient activeYear={activeYear} levels={levels} />;
}
