import axios from "axios";

const getRandomAnimeRequest = async () => {
  try {
    const { data } = await axios.get(
      `https://kitsu.io/api/edge/anime/${Math.floor(Math.random() * 5000) + 1}`
    );
    return data;
  } catch (error: any) {
    throw error;
  }
};

const getAnimeById = async (id: string) => {
  try {
    const { data } = await axios.get(`https://kitsu.io/api/edge/anime/${id}`);
    return data;
  } catch (error: any) {
    throw error;
  }
};

export { getRandomAnimeRequest, getAnimeById };
