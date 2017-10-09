package com.mobi.rdf.orm.generate;

/*-
 * #%L
 * rdf.orm.generate
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
import org.apache.commons.lang3.tuple.Pair;
import org.openrdf.model.Model;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.rio.*;
import org.openrdf.rio.helpers.StatementCollector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

// TODO - use mobi graph reading utilities instead of sesame
public class GraphReadingUtility {

    private static final Logger LOG = LoggerFactory.getLogger(GraphReadingUtility.class);

    public static Model readOntologies(final Collection<Pair<File, String>> pairs) throws IOException {
        final Model overall = new LinkedHashModel();
        final List<String> issues = new ArrayList<>();
        pairs.parallelStream().forEach(pair -> {
            try {
                readOntology(pair.getLeft(), pair.getRight());
            } catch (Exception e) {
                LOG.error("Issue reading ontology '" + pair.getLeft() + "'" + e.getMessage(), e);
                issues.add("Issue reading ontology '" + pair.getLeft() + "'" + e.getMessage()
                        + "\n\tEnsure the file format matches type file suffix.");
            }
        });
        if (!pairs.isEmpty()) {
            throw new IOException(StringUtils.join(issues, "\n"));
        }
        return overall;
    }

    public static Model readOntology(final File file, final String baseUri)
            throws RDFParseException, RDFHandlerException, UnsupportedRDFormatException, IOException {
        try (final InputStream is = new FileInputStream(file)) {
            final Optional<RDFFormat> format = Rio.getParserFormatForFileName(file.getName());
            if (format.isPresent()) {
                LOG.info("Reading file '" + file.getAbsolutePath() + "' assumed format: " + format.get());
                return readOntology(format.get(), is, baseUri);
            } else {
                throw new IOException("Could not identify format of file containing ontology: " + file.getName());
            }
        }
    }

    public static Model readOntology(final RDFFormat format, final InputStream is, final String baseURI)
            throws RDFParseException, RDFHandlerException, UnsupportedRDFormatException, IOException {
        final StatementCollector collector = new StatementCollector();
        final RDFParser parser = Rio.createParser(format);
        parser.setRDFHandler(collector);
        parser.parse(is, baseURI);
        return new LinkedHashModel(collector.getStatements());
    }

}