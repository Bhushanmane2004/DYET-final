import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dar6mcvkm",
  api_key: "616941356144945",
  api_secret: "f76andfCE52JhAM60W601ssDoGQ",
});

export default cloudinary;

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folderPath: string,
  fileName: string
): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder: folderPath,
          public_id: fileName,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(new Error(`Failed to upload to Cloudinary: ${error.message}`));
          } else if (result) {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          } else {
            reject(new Error("No result returned from Cloudinary"));
          }
        }
      )
      .on("error", (err) => {
        console.error("Upload stream error:", err);
        reject(new Error(`Upload stream failed: ${err.message}`));
      })
      .end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: "raw" }, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        reject(new Error(`Failed to delete from Cloudinary: ${error.message}`));
      } else {
        resolve(result);
      }
    });
  });
};