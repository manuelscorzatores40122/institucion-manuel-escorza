import AcademicYearsClient from './AcademicYearsClient';
import { getAcademicYears } from './actions';

export const metadata = {
  title: 'Años Escolares - I.E. Manuel Scorza',
};

export default async function AcademicYearsPage() {
  const years = await getAcademicYears();
  return <AcademicYearsClient years={years} />;
}
