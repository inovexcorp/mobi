# Backup and Restore
The process where the cli can back up and restore a mobi instance

## Backup
Command to back up mobi instance

```shell
karaf@mobi()> mobi:backup
Backed up the ontologyCache repository
Backed up the system repository
Backed up the prov repository
Back up complete at {{path}}/20231017-04004758137582013434308.zip
```

### Backup Zip File
The zip file contains the data necessary to restore a mobi instance. 

Zip file contains
* manifest.json file
* configurations.zip file that contains mobi instance etc folder
* policies.zip file
* repos directory that contains compress trig files of each repo

#### manifest.json
```json
{
    "version": "2.5.0-SNAPSHOT",
    "date": "2023-10-17T13:53:39.765912-04:00",
    "repositories":     {
        "ontologyCache": "repos/ontologyCache.zip",
        "system": "repos/system.zip",
        "prov": "repos/prov.zip"
    }
}
```

## Restore
The process of restore previous backup into running mobi instance. 
**WARNING: This command will delete existing data and configurations.**

```shell
karaf@mobi()> mobi:restore {{backup zip filename}}
```

# Version Range
https://maven.apache.org/ref/3.2.1/maven-artifact/apidocs/org/apache/maven/artifact/versioning/VersionRange.html
```
1.0 Version 1.0
[1.0,2.0) Versions 1.0 (included) to 2.0 (not included)
[1.0,2.0] Versions 1.0 to 2.0 (both included)
[1.5,) Versions 1.5 and higher
(,1.0],[1.2,) Versions up to 1.0 (included) and 1.2 or higher
```