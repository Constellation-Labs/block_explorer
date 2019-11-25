package org.constellation.blockexplorer.handler.input

import com.amazonaws.services.s3.AmazonS3ClientBuilder
import com.amazonaws.services.s3.model.S3Object
import org.apache.commons.io.IOUtils
import org.constellation.blockexplorer.handler.serializer.Serializer
import org.constellation.consensus.StoredSnapshot

import scala.util.Try

class S3Handler(serializer: Serializer) {

  private type S3ObjectProperties = (String, String)

  private val S3Client = AmazonS3ClientBuilder.defaultClient()

  def getSnapshots(toDownload: List[S3ObjectProperties]): List[StoredSnapshot] =
    getListOfObjects(toDownload).flatMap(s => Try(parseToSnapshot(s)).toOption)

  private def parseToSnapshot(s3Object: S3Object): StoredSnapshot =
    serializer.deserialize[StoredSnapshot](IOUtils.toByteArray(s3Object.getObjectContent))

  private def getListOfObjects(toDownload: List[S3ObjectProperties]): List[S3Object] =
    toDownload.flatMap(o => Try(getObject(o._1, o._2)).toOption)

  private def getObject(bucketName: String, objectKey: String): S3Object =
    S3Client.getObject(bucketName, objectKey)
}
