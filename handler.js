const { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand  } = require("@aws-sdk/client-s3");
const REGION = "eu-west-1";
const BUCKET_NAME = 'rpayeras-aws-lambda-s3'

module.exports = {
  thumbnailsList: async (event) => {
    const client = new S3Client({ region: REGION });

    let statusCode = 200
    let body = {}
    let thumbnails = []
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: "thumbnails/"
    }

    try {
      const command = new ListObjectsV2Command(params);
      const response = await client.send(command);
      thumbnails = response.Contents;
      body = JSON.stringify(thumbnails.filter(item => item.Size).map(thumb => `https://${BUCKET_NAME}.s3.amazonaws.com/${thumb.Key}`))
    } catch (err) {
      console.log(err)
      statusCode = 500
      body = JSON.stringify(err)
    }
    return {
      statusCode,
      headers: {'Access-Control-Allow-Origin': '*'},
      body,
    };
  },
  imageUpload: async (event) => {
    const client = new S3Client({ region: REGION });

    for(const record of event.Records){
      const uploadCommand = new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: BUCKET_NAME+'/'+record.s3.object.key,
        Key: record.s3.object.key.replace('images', 'thumbnails')
      });

      const uploadRes = await client.send(uploadCommand);

      console.log(uploadRes)

      const deleteCommand = DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: record.s3.object.key
      })

      const deleteRes = await client.send(deleteCommand);

      console.log(deleteRes)

      console.log(`Thumbnail for an imagge ${record.s3.object.key} created`)
    }

    return {
      statusCode: 202
    }
  }
};
