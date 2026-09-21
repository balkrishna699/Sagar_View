import { NetCDF4 } from "@earthyscience/netcdf4-wasm";

export async function loadNetCDFFile(url, onProgress) {

  function progress(message) {
    console.log(message);

    if (onProgress) {
      onProgress(message);
    }
  }


  progress("A. Fetching NetCDF file...");

  const response = await fetch(url);


  if (!response.ok) {
    throw new Error(
      `HTTP error: ${response.status}`
    );
  }


  progress("B. File fetched successfully.");


  progress("C. Converting file to Blob...");

  const blob = await response.blob();


  progress(
    `D. Blob created (${blob.size} bytes).`
  );


  progress(
    "E. Sending Blob to NetCDF4 reader..."
  );


  const dataset =
    await NetCDF4.fromBlobLazy(blob);


  progress(
    "F. NetCDF4 reader opened the dataset!"
  );


  return dataset;
}