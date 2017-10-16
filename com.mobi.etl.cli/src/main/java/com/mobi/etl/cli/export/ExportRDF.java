package com.mobi.etl.cli.export;

/*-
 * #%L
 * com.mobi.etl.cli
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
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import com.mobi.etl.api.config.rdf.export.RDFExportConfig;
import com.mobi.etl.api.rdf.export.RDFExportService;
import org.openrdf.rio.RDFFormat;

import java.io.OutputStream;

@Command(scope = "mobi", name = "export", description = "Exports objects from a repository or dataset")
@Service
public class ExportRDF extends ExportBase implements Action {

    // Service References

    @Reference
    private RDFExportService exportService;

    public void setExportService(RDFExportService exportService) {
        this.exportService = exportService;
    }

    // Command Parameters

    @Option(name = "-r", aliases = "--repository", description = "The id of the repository that data will be "
            + "exported from")
    String repositoryId = null;

    @Option( name = "-subj", aliases = "--subject", description = "A subject filter for exported data.")
    String subj = null;

    @Option(name = "-pred", aliases = "--predicate", description = "A predicate filter for exported data.")
    String predicate = null;

    @Option(name = "-objIRI", aliases = "--objectIRI", description = "An object filter for exported data. Takes " +
            "precedence over ObjectLiteral")
    String objIRI = null;

    @Option(name = "-objLit", aliases = "--objectLiteral", description = "An object literal filter for exported data. " +
            "ObjectIRI takes precedence")
    String objLit = null;

    @Option(name = "-g", aliases = "--graph", description = "A graph filter for exported data.")
    String graph = null;

    // Implementation

    @Override
    public Object execute() throws Exception {
        if (StringUtils.isEmpty(repositoryId)) {
            repositoryId = "system";
        }

        OutputStream output = getOuput();
        RDFFormat outputFormat = getFormat();

        RDFExportConfig config = new RDFExportConfig.Builder(output, outputFormat)
                .subj(subj)
                .pred(predicate)
                .objIRI(objIRI)
                .objLit(objLit)
                .graph(graph)
                .build();

        exportService.export(config, repositoryId);

        return null;
    }
}
