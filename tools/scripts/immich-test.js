import axios from "axios";

const immichUrl = process.env.IMMICH_URL || process.env.IMMICH_API_URL || "";
const immichApiKey = process.env.IMMICH_API_KEY || process.env.IMMICH_KEY || "";

// possible to be a list of album IDs delimited by commas
const immichAlbumid = process.env.IMMICH_ALBUM_IDS || "";

console.log("Immich URL:", immichUrl);
console.log("Immich API Key:", immichApiKey ? "[REDACTED]" : "[NOT SET]");
console.log("Immich Album ID:", immichAlbumid);

axios
  .get(`${immichUrl}/api/albums/${immichAlbumid}`, {
    headers: { "X-API-Key": immichApiKey, Accept: "application/json" },
    responseType: "json",
  })
  .then((response) => {
    console.log("Resp:", response.data);
    // console.log('Count of assets:', assets.length);
  })
  .catch((error) => {
    console.log(error);
  });
