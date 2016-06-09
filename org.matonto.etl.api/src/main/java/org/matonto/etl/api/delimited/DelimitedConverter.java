package org.matonto.etl.api.delimited;

import org.matonto.etl.api.config.ExcelConfig;
import org.matonto.etl.api.config.SVConfig;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Model;

import java.io.IOException;

public interface DelimitedConverter {
    Model convert(SVConfig config) throws IOException, MatOntoException;

    Model convert(ExcelConfig config) throws IOException, MatOntoException;
}
