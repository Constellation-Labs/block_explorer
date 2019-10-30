organization := "org.constellation"
name := "block-explorer"
version := "1.0.0"
scalaVersion := "2.12.9"
crossScalaVersions := Seq("2.12.9", "2.13.0")

val CatsVersion = "2.0.0"
val CatsEffectVersion = "2.0.0"
val CirceConfigVersion = "0.7.0"
val CirceGenericExVersion = "0.12.2"
val CirceJava8Version = "0.12.0-M1"
val CirceVersion = "0.12.3"
val EnumeratumCirceVersion = "1.5.22"
val FuuidVersion = "0.3.0-M3"
val Http4sVersion = "0.21.0-M5"
val KindProjectorVersion = "0.10.3"
val Log4CatsVersion = "1.0.1"
val LogbackVersion = "1.2.3"
val MockitoVersion = "1.6.2"
val ScalaCheckVersion = "1.14.2"
val ScalaTestVersion = "3.2.0-M1"

libraryDependencies ++= Seq(
    "org.typelevel"         %% "cats-core"              % CatsVersion,
    "org.typelevel"         %% "cats-effect"            % CatsEffectVersion,
    "io.chrisdavenport"     %% "log4cats-core"          % Log4CatsVersion,
    "io.chrisdavenport"     %% "log4cats-slf4j"         % Log4CatsVersion,
    "io.chrisdavenport"     %% "fuuid"                  % FuuidVersion,
    "io.circe"              %% "circe-generic"          % CirceVersion,
    "io.circe"              %% "circe-literal"          % CirceVersion,
    "io.circe"              %% "circe-generic-extras"   % CirceGenericExVersion,
    "io.circe"              %% "circe-parser"           % CirceVersion,
    "io.circe"              %% "circe-java8"            % CirceJava8Version,
    "io.circe"              %% "circe-config"           % CirceConfigVersion,
    "com.beachape"          %% "enumeratum-circe"       % EnumeratumCirceVersion,
    "org.http4s"            %% "http4s-blaze-server"    % Http4sVersion,
    "org.http4s"            %% "http4s-circe"           % Http4sVersion,
    "org.http4s"            %% "http4s-dsl"             % Http4sVersion,
    "ch.qos.logback"        %  "logback-classic"        % LogbackVersion,
    "org.http4s"            %% "http4s-blaze-client"    % Http4sVersion     % Test,
    "org.scalacheck"        %% "scalacheck"             % ScalaCheckVersion % Test,
    "org.scalatest"         %% "scalatest"              % ScalaTestVersion  % Test,
    "org.mockito"           %% "mockito-scala"          % MockitoVersion    % Test,
    "org.mockito"           %% "mockito-scala-cats"     % MockitoVersion    % Test
)

def scalacOptionsForVersion(version: String): Seq[String] = {
    // format: off
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
        "-Xlint:adapted-args",
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
        "-Ywarn-dead-code",
        "-Ywarn-extra-implicit",
        "-Ywarn-numeric-widen",
        "-Ywarn-unused:implicits",
        "-Ywarn-unused:imports",
        "-Ywarn-unused:locals",
        "-Ywarn-unused:params",
        "-Ywarn-unused:patvars",
        "-Ywarn-unused:privates",
        "-Ywarn-value-discard",
    )
    val versionOpts: Seq[String] = CrossVersion.partialVersion(version) match {
        case Some((2, major)) if major < 13 => Seq(
            "-Xlint:by-name-right-associative",
            "-Xlint:unsound-match",
            "-Xfatal-warnings",
            "-Xfuture",
            "-Yno-adapted-args",
            "-Ypartial-unification",
            "-Ywarn-inaccessible",
            "-Ywarn-infer-any",
            "-Ywarn-nullary-override",
            "-Ywarn-nullary-unit",
        )
        case _ => Seq()
    }
    defaultOpts ++ versionOpts
    // format: on
}

scalacOptions ++= scalacOptionsForVersion(scalaVersion.value)

addCompilerPlugin(
    ("org.typelevel" %% "kind-projector" % KindProjectorVersion).cross(CrossVersion.binary),
)

enablePlugins(ScalafmtPlugin, JavaAppPackaging)

// Filter out compiler flags to make the repl experience functional...
val badConsoleFlags = Seq("-Xfatal-warnings", "-Ywarn-unused:imports")
scalacOptions in (Compile, console) ~= (_.filterNot(badConsoleFlags.contains(_)))

// Note: This fixes error with sbt run not loading config properly
fork in run := true
