package org.matonto.etl.api.csv;

import org.openrdf.model.Model;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.RDFParseException;

import java.io.File;
import java.io.IOException;

public interface CSVConverter {
    public void importCSV(File csv, File mappingFile, String repoID)  throws RDFParseException, IOException, RepositoryException;

    public void importCSV(File csv, Model mappingModel, String repoID) throws IOException, RepositoryException;

    public Model convert(File csv, File mappingFile) throws IOException, RDFParseException;

    public Model convert(File csv, Model mappingModel) throws IOException;

}
