lazy val _version = "1.0.0"

lazy val projectSettings = Seq(
  organization := "org.constellation",
  name := "block-explorer",
  version := _version,
  scalaVersion := "2.12.9"
)

addCompilerPlugin(
  "org.typelevel" %% "kind-projector" % versions.KindProjectorVersion
)
enablePlugins(ScalafmtPlugin, JavaAppPackaging)

// format: off
javacOptions ++= Seq(
    "-source", "1.8",
    "-target", "1.8",
    "-Xlint"
)

scalacOptions ++= {
    val defaultOpts = Seq(
        "-deprecation",
        "-encoding", "utf-8",
        "-explaintypes",
        "-feature",
        "-language:existentials",
        "-language:experimental.macros",
        "-language:higherKinds",
        "-language:implicitConversions",
        "-unchecked",
        "-Xcheckinit",
        "-Xfatal-warnings",
        "-Xfuture",
        "-Xlint:adapted-args",
        "-Xlint:by-name-right-associative",
        "-Xlint:constant",
        "-Xlint:delayedinit-select",
        "-Xlint:doc-detached",
        "-Xlint:inaccessible",
        "-Xlint:infer-any",
        "-Xlint:missing-interpolator",
        "-Xlint:nullary-override",
        "-Xlint:nullary-unit",
        "-Xlint:option-implicit",
        "-Xlint:package-object-classes",
        "-Xlint:poly-implicit-overload",
        "-Xlint:private-shadow",
        "-Xlint:stars-align",
        "-Xlint:type-parameter-shadow",
        "-Xlint:unsound-match",
        "-Yno-adapted-args",
        "-Ypartial-unification",
        "-Ywarn-dead-code",
        "-Ywarn-extra-implicit",
        "-Ywarn-infer-any",
        "-Ywarn-inaccessible",
        "-Ywarn-numeric-widen",
        "-Ywarn-nullary-override",
        "-Ywarn-nullary-unit",
        "-Ywarn-unused:implicits",
        "-Ywarn-unused:imports",
        "-Ywarn-unused:locals",
        "-Ywarn-unused:params",
        "-Ywarn-unused:patvars",
        "-Ywarn-unused:privates",
        "-Ywarn-value-discard"
    )
    defaultOpts
}

lazy val versions = new {
  val AwsLambdaJavaCoreVersion      =       "1.2.0"
  val AwsLambdaJavaEventsVersion    =       "2.2.2"
  val AwsJavaSdkS3Version           =       "1.11.665"
  val AwsJavaSdkSQSVersion          =       "1.11.665"
  val BetterFilesVersion            =       "3.8.0"
  val CirceVersion                  =       "0.12.3"
  val CommonIOVersion               =       "2.6"
  val Elastic4sVersion              =       "7.3.1"
  val KindProjectorVersion          =       "0.10.3"
  val LogbackVersion                =       "1.2.3"
  val MockitoVersion                =       "1.6.2"
  val ScalaCheckVersion             =       "1.14.2"
  val ScalaTestVersion              =       "3.0.8"
  val Slf4jApiVersion               =       "1.7.25"
  val SttpCoreVersion               =       "2.0.0-RC1"
  val TwitterChillVersion           =       "0.9.3"
  val TypesafeVersion               =       "1.4.0"
  val EnumeratumVersion             =       "1.5.23"
  val ConstellationNodeJarVersion   =       "2.8.1"
}

lazy val sharedDependencies = Seq(
  "com.amazonaws"                   % "aws-lambda-java-core"        % versions.AwsLambdaJavaCoreVersion,
  "com.amazonaws"                   % "aws-lambda-java-events"      % versions.AwsLambdaJavaEventsVersion,
  "com.softwaremill.sttp.client"    %% "core"                       % versions.SttpCoreVersion,
  "io.circe"                        %% "circe-core"                 % versions.CirceVersion,
  "io.circe"                        %% "circe-generic"              % versions.CirceVersion,
  "io.circe"                        %% "circe-parser"               % versions.CirceVersion,
  // Test dependencies
  "org.mockito"                     %% "mockito-scala"              % versions.MockitoVersion           % Test,
  "org.mockito"                     %% "mockito-scala-cats"         % versions.MockitoVersion           % Test,
  "org.scalacheck"                  %% "scalacheck"                 % versions.ScalaCheckVersion        % Test,
  "org.scalatest"                   %% "scalatest"                  % versions.ScalaTestVersion         % Test
)

lazy val apiDependencies = Seq(
  "com.sksamuel.elastic4s"          %% "elastic4s-core"             % versions.Elastic4sVersion,
  "com.sksamuel.elastic4s"          %% "elastic4s-client-esjava"    % versions.Elastic4sVersion,
  "com.sksamuel.elastic4s"          %% "elastic4s-http-streams"     % versions.Elastic4sVersion,
  // Test dependencies
  "com.sksamuel.elastic4s"          %% "elastic4s-testkit"          % versions.Elastic4sVersion          % Test
) ++ sharedDependencies

lazy val schemaDependencies = Seq(
  "org.constellation"               % "cl-node"                     % versions.ConstellationNodeJarVersion from s"https://github.com/Constellation-Labs/constellation/releases/download/v${versions.ConstellationNodeJarVersion}/cl-node.jar",
  "com.beachape" %% "enumeratum-circe" % versions.EnumeratumVersion
)

lazy val configDependencies = Seq(
  "com.typesafe"                    % "config"                      % versions.TypesafeVersion
)

lazy val rootDependencies = Seq(
  "org.constellation"               % "cl-node"                     % versions.ConstellationNodeJarVersion from s"https://github.com/Constellation-Labs/constellation/releases/download/v${versions.ConstellationNodeJarVersion}/cl-node.jar",
  "com.amazonaws"                   % "aws-java-sdk-s3"             % versions.AwsJavaSdkS3Version,
  "com.amazonaws"                   % "aws-java-sdk-sqs"            % versions.AwsJavaSdkSQSVersion,
  "com.amazonaws"                   % "aws-lambda-java-core"        % versions.AwsLambdaJavaCoreVersion,
  "com.amazonaws"                   % "aws-lambda-java-events"      % versions.AwsLambdaJavaEventsVersion,
  "com.github.pathikrit"            %% "better-files"               % versions.BetterFilesVersion,
  "com.twitter"                     %% "chill"                      % versions.TwitterChillVersion,
  "commons-io"                      % "commons-io"                  % versions.CommonIOVersion,
  "ch.qos.logback"                  % "logback-classic"             % versions.LogbackVersion,
  "org.slf4j"                       % "slf4j-api"                   % versions.Slf4jApiVersion
) ++ sharedDependencies
// format: on

lazy val root = (project in file("."))
  .dependsOn(schema, config)
  .enablePlugins(BuildInfoPlugin)
  .settings(
    buildInfoKeys := Seq[BuildInfoKey](name, version, scalaVersion, sbtVersion),
    buildInfoPackage := "org.constellation.blockexplorer.handler",
    buildInfoOptions := Seq(BuildInfoOption.BuildTime, BuildInfoOption.ToMap),
    projectSettings,
    libraryDependencies ++= rootDependencies,
    mainClass := Some("org.constellation.blockexplorer.handler.RequestHandler")
  )

lazy val schema = (project in file("schema"))
  .enablePlugins(BuildInfoPlugin)
  .settings(
    buildInfoKeys := Seq[BuildInfoKey](version),
    buildInfoPackage := "org.constellation.blockexplorer.schema",
    buildInfoOptions ++= Seq(BuildInfoOption.BuildTime, BuildInfoOption.ToMap),
    libraryDependencies ++= schemaDependencies
  )

lazy val api = (project in file("api"))
  .dependsOn(schema, config)
  .enablePlugins(BuildInfoPlugin)
  .settings(
    buildInfoKeys := Seq[BuildInfoKey](version),
    buildInfoPackage := "org.constellation.blockexplorer.api",
    buildInfoOptions ++= Seq(BuildInfoOption.BuildTime, BuildInfoOption.ToMap),
    libraryDependencies ++= apiDependencies
  )

lazy val config = (project in file("config"))
  .enablePlugins(BuildInfoPlugin)
  .settings(
    buildInfoKeys := Seq[BuildInfoKey](version),
    buildInfoPackage := "org.constellation.blockexplorer.config",
    buildInfoOptions ++= Seq(BuildInfoOption.BuildTime, BuildInfoOption.ToMap),
    libraryDependencies ++= configDependencies
  )

// Filter out compiler flags to make the repl experience functional...
val badConsoleFlags = Seq("-Xfatal-warnings", "-Ywarn-unused:imports")
scalacOptions in (Compile, console) ~= (_.filterNot(
  badConsoleFlags.contains(_)
))

// Note: This fixes error with sbt run not loading config properly
fork in run := true

assemblyMergeStrategy in assembly := {
  case PathList("META-INF", xs @ _*) => MergeStrategy.discard
  case x                             => MergeStrategy.first
}
