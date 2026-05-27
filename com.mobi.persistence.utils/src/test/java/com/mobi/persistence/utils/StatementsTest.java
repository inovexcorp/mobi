package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.junit.Before;
import org.junit.Test;

public class StatementsTest {

    private ValueFactory vf;
    private IRI subject;
    private IRI predicate;

    @Before
    public void setUp() {
        vf = new ValidatingValueFactory();
        subject = vf.createIRI("http://example.org/subject");
        predicate = vf.createIRI("http://example.org/predicate");
    }

    @Test
    public void normalizeLanguageTag_uppercaseSubtag() {
        Literal lit = vf.createLiteral("Label", "en-US");
        Statement original = vf.createStatement(subject, predicate, lit);

        Statement normalized = Statements.normalizeLanguageTag(original, vf);

        Literal normalizedLit = (Literal) normalized.getObject();
        assertEquals("en-us", normalizedLit.getLanguage().orElse(""));
        assertEquals("Label", normalizedLit.getLabel());
        assertEquals(subject, normalized.getSubject());
        assertEquals(predicate, normalized.getPredicate());
    }

    @Test
    public void normalizeLanguageTag_alreadyLowercase() {
        Literal lit = vf.createLiteral("Label", "en-us");
        Statement original = vf.createStatement(subject, predicate, lit);

        Statement normalized = Statements.normalizeLanguageTag(original, vf);

        assertSame(original, normalized);
    }

    @Test
    public void normalizeLanguageTag_simpleLowercaseTag() {
        Literal lit = vf.createLiteral("Label", "en");
        Statement original = vf.createStatement(subject, predicate, lit);

        Statement normalized = Statements.normalizeLanguageTag(original, vf);

        assertSame(original, normalized);
    }

    @Test
    public void normalizeLanguageTag_noLanguageTag() {
        Literal lit = vf.createLiteral("Label");
        Statement original = vf.createStatement(subject, predicate, lit);

        Statement normalized = Statements.normalizeLanguageTag(original, vf);

        assertSame(original, normalized);
    }

    @Test
    public void normalizeLanguageTag_typedLiteral() {
        Literal lit = vf.createLiteral(42);
        Statement original = vf.createStatement(subject, predicate, lit);

        Statement normalized = Statements.normalizeLanguageTag(original, vf);

        assertSame(original, normalized);
    }

    @Test
    public void normalizeLanguageTag_iriObject() {
        IRI obj = vf.createIRI("http://example.org/object");
        Statement original = vf.createStatement(subject, predicate, obj);

        Statement normalized = Statements.normalizeLanguageTag(original, vf);

        assertSame(original, normalized);
    }

    @Test
    public void normalizeLanguageTag_complexSubtag() {
        Literal lit = vf.createLiteral("Label", "zh-Hans-CN");
        Statement original = vf.createStatement(subject, predicate, lit);

        Statement normalized = Statements.normalizeLanguageTag(original, vf);

        Literal normalizedLit = (Literal) normalized.getObject();
        assertEquals("zh-hans-cn", normalizedLit.getLanguage().orElse(""));
    }

    @Test
    public void normalizeLanguageTag_preservesContext() {
        Literal lit = vf.createLiteral("Label", "en-US");
        IRI context = vf.createIRI("http://example.org/graph");
        Statement original = vf.createStatement(subject, predicate, lit, context);

        Statement normalized = Statements.normalizeLanguageTag(original, vf);

        assertEquals(context, normalized.getContext());
        Literal normalizedLit = (Literal) normalized.getObject();
        assertEquals("en-us", normalizedLit.getLanguage().orElse(""));
    }
}
