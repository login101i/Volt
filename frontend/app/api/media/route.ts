import { NextRequest, NextResponse } from "next/server";
import S3 from "aws-sdk/clients/s3";
import { randomUUID } from "crypto";

const s3 = new S3({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: process.env.REGION,
  signatureVersion: "v4",
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get("fileType");

    if (!fileType) {
      return NextResponse.json(
        { error: "fileType parameter is required" },
        { status: 400 }
      );
    }

    const ex = fileType.split("/")[1];

    const Key = `pictures/${randomUUID()}.${ex}`;

    const s3Params = {
      Bucket: process.env.BUCKET_NAME,
      Key,
      Expires: 60,
      ContentType: `image/${ex}`,
    };

    const uploadUrl = await s3.getSignedUrl("putObject", s3Params);

    // Construct the public S3 URL
    const bucketName = process.env.BUCKET_NAME;
    const region = process.env.REGION;
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${Key}`;

    console.log("uploadUrl", uploadUrl);

    return NextResponse.json({
      uploadUrl,
      key: Key,
      url: s3Url, // Full S3 URL for accessing the uploaded file
    });
  } catch (error: any) {
    console.error("Error generating S3 signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", message: error.message },
      { status: 500 }
    );
  }
}

