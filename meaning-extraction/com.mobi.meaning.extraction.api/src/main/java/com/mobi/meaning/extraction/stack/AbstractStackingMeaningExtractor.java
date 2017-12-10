package com.mobi.meaning.extraction.stack;

/*-
 * #%L
 * meaning.extraction.api
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

import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.MeaningExtractor;
import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.rdf.api.Model;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.Stack;
import java.util.stream.Collectors;

public abstract class AbstractStackingMeaningExtractor<T extends StackItem> implements MeaningExtractor, StackingMeaningExtractor<T> {

    private final String delimiter;

    private final String prefix;

    private final String suffix;

    private final Stack<T> stack;

    protected AbstractStackingMeaningExtractor() {
        this("|", "{", "}");
    }

    protected AbstractStackingMeaningExtractor(String delimiter, String prefix, String suffix) {
        this.delimiter = delimiter;
        this.prefix = prefix;
        this.suffix = suffix;
        this.stack = new Stack<>();
    }

    @Override
    public void pushStack(T item) {
        stack.add(item);
    }

    @Override
    public T popStack() {
        return stack.pop();
    }

    @Override
    public String getCurrentLocation() {
        return stack.stream().map(StackItem::getIdentifier).collect(Collectors.joining(delimiter, prefix, suffix));
    }

    @Override
    public Model extractMeaning(Path rawFile, ExtractedOntology managedOntology) throws MeaningExtractionException {
        try (final InputStream is = new FileInputStream(rawFile.toFile())) {
            return extractMeaning(is, rawFile.toAbsolutePath().toString(), managedOntology);
        } catch (IOException e) {
            throw new MeaningExtractionException("Issue reading specified file to extract meaning", e);
        }
    }
}
