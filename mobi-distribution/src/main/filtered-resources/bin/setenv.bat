@echo off
rem
rem
rem    Licensed to the Apache Software Foundation (ASF) under one or more
rem    contributor license agreements.  See the NOTICE file distributed with
rem    this work for additional information regarding copyright ownership.
rem    The ASF licenses this file to You under the Apache License, Version 2.0
rem    (the "License"); you may not use this file except in compliance with
rem    the License.  You may obtain a copy of the License at
rem
rem       http://www.apache.org/licenses/LICENSE-2.0
rem
rem    Unless required by applicable law or agreed to in writing, software
rem    distributed under the License is distributed on an "AS IS" BASIS,
rem    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
rem    See the License for the specific language governing permissions and
rem    limitations under the License.
rem

rem
rem handle specific scripts; the SCRIPT_NAME is exactly the name of the Karaf
rem script; for example karaf.bat, start.bat, stop.bat, admin.bat, client.bat, ...
rem
rem if "%KARAF_SCRIPT%" == "SCRIPT_NAME" (
rem   Actions go here...
rem )

rem
rem general settings which should be applied for all scripts go here; please keep
rem in mind that it is possible that scripts might be executed more than once, e.g.
rem in example of the start script where the start script is executed first and the
rem karaf script afterwards.
rem

rem
rem The following section shows the possible configuration options for the default
rem karaf scripts
rem
rem The settings below are designed to be overridden by the environment.
rem Defaults are only applied when a value has NOT already been provided
rem externally, and operator-supplied JVM flags are appended to the distribution
rem defaults rather than replacing them.
rem
rem Variables an operator may set in the environment:
rem   JAVA_MIN_MEM      Minimum heap (-Xms). Default: 512M
rem   JAVA_MAX_MEM      Maximum heap (-Xmx). Default: 1024M
rem   JAVA_OPTS         Extra generic JVM options; appended after the memory flags
rem   EXTRA_JAVA_OPTS   Additional JVM options; appended after the defaults below
rem Note: for a duplicated raw flag (e.g. two -Xmx), the JVM uses the LAST one,
rem so externally-supplied flags (appended later) take precedence.
rem
rem Window name of the windows console
rem SET KARAF_TITLE
rem Location of Java installation
rem SET JAVA_HOME
rem Apply memory defaults only when not already set in the environment.
if not defined JAVA_MIN_MEM SET JAVA_MIN_MEM=512M
if not defined JAVA_MAX_MEM SET JAVA_MAX_MEM=1024M
rem Build JAVA_OPTS from the (possibly overridden) memory settings, preserving any
rem JAVA_OPTS already provided externally. Memory flags come first so a raw
rem -Xms/-Xmx supplied via JAVA_OPTS still wins (last-flag-wins).
SET JAVA_OPTS=-Xms%JAVA_MIN_MEM% -Xmx%JAVA_MAX_MEM% %JAVA_OPTS%
rem Additional JVM options
rem SET JAVA_NON_DEBUG_OPTS
rem Additional non-debug JVM options
rem Keep the distribution's required defaults and append any externally-provided
rem EXTRA_JAVA_OPTS so operator flags are applied (and win on conflict).
SET DEFAULT_EXTRA_JAVA_OPTS=-Xss4m -Dfile.encoding=UTF-8
SET EXTRA_JAVA_OPTS=%DEFAULT_EXTRA_JAVA_OPTS% %EXTRA_JAVA_OPTS%
rem Karaf home folder
rem SET KARAF_HOME
rem Karaf data folder
rem SET KARAF_DATA
rem Karaf base folder
rem SET KARAF_BASE
rem Karaf etc folder
rem SET KARAF_ETC
rem First citizen Karaf options
rem SET KARAF_SYSTEM_OPTS
rem Additional available Karaf options
rem SET KARAF_OPTS
rem Enable debug mode
rem SET KARAF_DEBUG