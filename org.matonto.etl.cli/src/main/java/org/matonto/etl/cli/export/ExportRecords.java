package org.matonto.etl.cli.export;

/*-
 * #%L
 * org.matonto.etl.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import org.apache.commons.lang.StringUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.matonto.etl.api.config.rdf.export.RecordExportConfig;
import org.matonto.etl.api.rdf.export.RecordExportService;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Command(scope = "mobi", name = "export-records", description = "Exports records from the local catalog")
@Service
public class ExportRecords implements Action {

    // Service References

    @Reference
    private RecordExportService exportService;

    public void setExportService(RecordExportService exportService) {
        this.exportService = exportService;
    }

    // Command Parameters

    @Argument(name = "CatalogRecords", description = "A comma-separated list of catalog record IDs to export")
    private String recordsParam = null;

    @Option(name = "-f", aliases = "--output-file", description = "The output file for the exported record data")
    private String filepathParam = null;

    @Option(name = "-t", aliases = "--format", description = "The output format (TRIG, NQUADS, JSONLD)")
    private String formatParam = null;

    // Implementation

    @Override
    public Object execute() throws Exception {
        OutputStream output;
        if (filepathParam != null) {
            output = new FileOutputStream(filepathParam);
        } else {
            output = System.out;
        }

        RDFFormat outputFormat;
        if (formatParam != null) {
            outputFormat = Rio.getParserFormatForMIMEType(formatParam)
                    .orElseThrow(() -> new IOException("Invalid file format."));
        } else if (filepathParam != null) {
            outputFormat = Rio.getParserFormatForFileName(filepathParam).orElse(RDFFormat.TRIG);
        } else {
            outputFormat = RDFFormat.TRIG;
        }

        RecordExportConfig.Builder builder = new RecordExportConfig.Builder(output, outputFormat);

        if (!StringUtils.isEmpty(recordsParam)) {
            Set<String> records = new HashSet<>(Arrays.asList(recordsParam.split(",")));
            builder.records(records);
        }

        exportService.export(builder.build());

        return null;
    }
}
