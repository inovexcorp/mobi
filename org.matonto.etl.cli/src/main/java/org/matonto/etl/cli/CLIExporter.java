package org.matonto.etl.cli;

/*-
 * #%L
 * org.matonto.etl.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.matonto.etl.api.config.ExportServiceConfig;
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.rdf.api.ValueFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Command(scope = "matonto", name = "export", description = "Exports objects from a repository or dataset")
@Service
public class CLIExporter implements Action {

    private static final Logger LOGGER = LoggerFactory.getLogger(CLIExporter.class);

    @Reference
    private RDFExportService exportService;

    @Reference
    private ValueFactory vf;

    @Argument(index = 0, name = "file", description = "The file that will contain the exported data", required = true)
    String filepath = null;

    @Option(name = "-r", aliases = "--repository", description = "The id of the repository that data will be "
            + "exported from")
    String repositoryId = null;

    @Option( name = "-d", aliases = "--dataset", description = "The id of the DatasetRecord the data will be "
            + "exported from")
    String datasetRecordId = null;

    @Option( name = "-subj", aliases = "--subject", description = "A subject that all exported triples will be "
            + "restricted to.")
    String subj = null;

    @Option(name = "-pred", aliases = "--predicate", description = "A predicate that all exported triples will be "
            + "restricted to.")
    String predicate = null;

    @Option(name = "-objIRI", aliases = "--objectIRI", description = "An object that all exported triples will be "
            + "restricted to. Takes precedence over ObjectLiteral")
    String objIRI = null;

    @Option(name = "-objLit", aliases = "--objectLiteral", description = "An object literal that all exported triples "
            + "will be restricted to. ObjectIRI takes precedence")
    String objLit = null;

    public void setExportService(RDFExportService exportService) {
        this.exportService = exportService;
    }

    public void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public Object execute() throws Exception {
        if ((StringUtils.isEmpty(repositoryId) && StringUtils.isEmpty(datasetRecordId))
                || (!StringUtils.isEmpty(repositoryId) && !StringUtils.isEmpty(datasetRecordId))) {
            String msg = "Repository ID or DatasetRecord ID is required";
            LOGGER.error(msg);
            System.out.println(msg);
            return null;
        }

        ExportServiceConfig config = new ExportServiceConfig.Builder(filepath)
                .subj(subj)
                .pred(predicate)
                .objIRI(objIRI)
                .objLit(objLit)
                .build();
        if (repositoryId != null) {
            exportService.exportToFile(config, repositoryId);
        } else {
            exportService.exportToFile(config, vf.createIRI(datasetRecordId));
        }

        return null;
    }
}
