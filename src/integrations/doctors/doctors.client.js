import "dotenv/config";

const DOCTORS_API_URL = process.env.DOCTORS_API_URL;

export const getDoctors = async () => {
  const response = await fetch(
    `${DOCTORS_API_URL}/api/v1/doctors`
  );

  if (!response.ok) {
    throw new Error(
      `Doctors API returned status ${response.status}`
    );
  }

  return response.json();
};