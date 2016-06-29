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

import java.io.File;
import java.io.IOException;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.log4j.Logger;
import org.matonto.etl.api.rdf.RDFImportService;

@Command(scope = "matonto", name = "import", description = "Imports objects to a repository")
@Service
public class CLIImporter implements Action {

    //Command Line Arguments and Options


    @Argument(index = 0, name = "ImportFile", description = "The file to be imported into the repository", required = true)
    String file = null;

    @Argument(index = 1, name = "RepositoryID", description = "The id of the repository the file will be imported to", required = true)
    String repositoryId = null;

    @Option( name = "-c", aliases = "--continueOnError", description = "If true, continue parsing even if there is an error on a line.")
    boolean continueOnError = false;
    private static final Logger LOGGER = Logger.getLogger(CLIImporter.class);

    @Reference
    private RDFImportService importService;

    public void setImportService(RDFImportService importService) {this.importService = importService;}

    @Override
    public Object execute() throws Exception {

        LOGGER.info("Importing RDF");
        try{
            File newFile = new File(file);
            importService.importFile(repositoryId, newFile, continueOnError);
        }catch(IOException e){
            System.out.println(e.getMessage());
            LOGGER.error(e.toString());
        }

        return null;
    }

}
