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

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.matonto.etl.api.rdf.RDFExportService;

@Command(scope = "matonto", name = "export", description="Exports objects from a repository")
@Service
public class CLIExporter implements Action {

    @Reference
    private RDFExportService exportService;

    @Argument(index = 0, name = "repId", description = "The id of the repository the file will be imported to", required = true)
    String repositoryId = null;

    @Argument(index = 1, name = "file", description = "The file to be imported into the repository", required = true)
    String filepath = null;

    @Option( name = "-subj", aliases="--subject", description = "A subject that all exported triples will be restricted to.")
    String subj = null;

    @Option(name = "-pred", aliases = "--predicate", description = "A predicate that all exported triples will be restricted to.")
    String predicate = null;

    @Option(name = "-objIRI", aliases = "--objectIRI", description = "An object that all exported triples will be restricted to. Takes precedence over ObjectLiteral")
    String objIRI = null;

    @Option(name = "-objLit", aliases = "--objectLiteral", description = "An object literal that all exported triples will be restricted to. ObjectIRI takes precedence")
    String objLit = null;

    public void setExportService(RDFExportService exportService) {
        this.exportService = exportService;
    }

    @Override
    public Object execute() throws Exception {

        exportService.exportToFile(repositoryId, filepath, subj, predicate, objIRI, objLit);

        return null;
    }
}
