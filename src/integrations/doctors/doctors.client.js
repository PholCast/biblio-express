import "dotenv/config";

const DOCTORS_API_URL = process.env.DOCTORS_API_URL;

export const getDoctor = async () => {
  const response = await fetch(
    `${DOCTORS_API_URL}/api/v2/doctors/last`
  );

  if (!response.ok) {
    throw new Error(
      `Doctors API returned status ${response.status}`
    );
  }

  return response.json();
};