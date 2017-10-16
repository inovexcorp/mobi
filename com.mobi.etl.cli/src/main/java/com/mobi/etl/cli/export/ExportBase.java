package com.mobi.etl.cli.export;

/*-
 * #%L
 * com.mobi.etl.cli
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

import org.apache.karaf.shell.api.action.Option;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class ExportBase {

    protected static final Map<String, RDFFormat> formats;

    static {
        formats = new HashMap<>();
        formats.put("ttl", RDFFormat.TURTLE);
        formats.put("trig", RDFFormat.TRIG);
        formats.put("trix", RDFFormat.TRIX);
        formats.put("rdf/xml", RDFFormat.RDFXML);
        formats.put("jsonld", RDFFormat.JSONLD);
        formats.put("n3", RDFFormat.N3);
        formats.put("nquads", RDFFormat.NQUADS);
        formats.put("ntriples", RDFFormat.NTRIPLES);
    }

    @Option(name = "-f", aliases = "--output-file", description = "The output file for the exported record data")
    protected String filepathParam = null;

    @Option(name = "-t", aliases = "--format", description = "The output format (ttl, trig, trix, rdf/xml, jsonld, " +
            "n3, nquads, ntriples)")
    protected String formatParam = null;

    protected OutputStream getOuput() throws IOException {
        if (filepathParam != null) {
            return new FileOutputStream(filepathParam);
        } else {
            return System.out;
        }
    }

    protected RDFFormat getFormat() throws IOException {
        if (formatParam != null && formats.containsKey(formatParam)) {
            return formats.get(formatParam);
        } else if (filepathParam != null) {
            return Rio.getParserFormatForFileName(filepathParam).orElse(RDFFormat.TRIG);
        } else {
            return RDFFormat.TRIG;
        }
    }
}
