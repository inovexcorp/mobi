package com.mobi.sparql.cli.rdf4j.queryrenderer;

/*-
 * #%L
 * com.mobi.sparql.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.algebra.OrderElem;
import org.eclipse.rdf4j.query.algebra.ProjectionElem;
import org.eclipse.rdf4j.query.algebra.ProjectionElemList;
import org.eclipse.rdf4j.query.parser.ParsedBooleanQuery;
import org.eclipse.rdf4j.query.parser.ParsedGraphQuery;
import org.eclipse.rdf4j.query.parser.ParsedQuery;
import org.eclipse.rdf4j.query.parser.ParsedTupleQuery;
import org.eclipse.rdf4j.queryrender.QueryRenderer;

import java.util.Iterator;

public class MobiSPARQLQueryRenderer implements QueryRenderer {
    private MobiSparqlTupleExprRenderer mRenderer = new MobiSparqlTupleExprRenderer();

    public MobiSPARQLQueryRenderer() {
    }

    public QueryLanguage getLanguage() {
        return QueryLanguage.SPARQL;
    }

    public String render(ParsedQuery theQuery) throws Exception {
        this.mRenderer.reset();
        StringBuffer aBody = new StringBuffer(this.mRenderer.render(theQuery.getTupleExpr()));
        boolean aFirst = true;
        StringBuffer aQuery = new StringBuffer();
        if (theQuery instanceof ParsedTupleQuery) {
            aQuery.append("select ");
        } else if (theQuery instanceof ParsedBooleanQuery) {
            aQuery.append("ask\n");
        } else {
            aQuery.append("construct ");
        }

        if (this.mRenderer.isDistinct()) {
            aQuery.append("distinct ");
        }

        if (this.mRenderer.isReduced() && theQuery instanceof ParsedTupleQuery) {
            aQuery.append("reduced ");
        }

        Iterator var5;
        if (!this.mRenderer.getProjection().isEmpty() && !(theQuery instanceof ParsedBooleanQuery)) {
            aFirst = true;
            if (!(theQuery instanceof ParsedTupleQuery)) {
                aQuery.append(" {\n");
            }

            var5 = this.mRenderer.getProjection().iterator();

            while(true) {
                while(var5.hasNext()) {
                    ProjectionElemList aList = (ProjectionElemList)var5.next();
                    ProjectionElem aElem;
                    if (MobiSparqlTupleExprRenderer.isSPOElemList(aList)) {
                        if (!aFirst) {
                            aQuery.append("\n");
                        } else {
                            aFirst = false;
                        }

                        aQuery.append("  ").append(this.mRenderer.renderPattern(this.mRenderer.toStatementPattern(aList)));
                    } else {
                        for(Iterator var7 = aList.getElements().iterator(); var7.hasNext(); aQuery.append("?" + aElem.getSourceName())) {
                            aElem = (ProjectionElem)var7.next();
                            if (!aFirst) {
                                aQuery.append(" ");
                            } else {
                                aFirst = false;
                            }
                        }
                    }
                }

                if (!(theQuery instanceof ParsedTupleQuery)) {
                    aQuery.append("}");
                }

                aQuery.append("\n");
                break;
            }
        } else if (this.mRenderer.getProjection().isEmpty()) {
            if (theQuery instanceof ParsedGraphQuery) {
                aQuery.append("{ }\n");
            } else if (theQuery instanceof ParsedTupleQuery) {
                aQuery.append("*\n");
            }
        }

        if (theQuery.getDataset() != null) {
            var5 = theQuery.getDataset().getDefaultGraphs().iterator();

            IRI aURI;
            while(var5.hasNext()) {
                aURI = (IRI)var5.next();
                aQuery.append("from <").append(aURI).append(">\n");
            }

            var5 = theQuery.getDataset().getNamedGraphs().iterator();

            while(var5.hasNext()) {
                aURI = (IRI)var5.next();
                aQuery.append("from named <").append(aURI).append(">\n");
            }
        }

        if (aBody.length() > 0) {
            if (aBody.toString().trim().lastIndexOf(",") == aBody.length() - 1) {
                aBody.setCharAt(aBody.lastIndexOf(","), ' ');
            }

            if (!(theQuery instanceof ParsedBooleanQuery)) {
                aQuery.append("where ");
            }

            aQuery.append("{\n");
            aQuery.append(aBody);
            aQuery.append("}");
        }

        if (!this.mRenderer.getOrdering().isEmpty()) {
            aQuery.append("\norder by ");
            aFirst = true;
            var5 = this.mRenderer.getOrdering().iterator();

            while(var5.hasNext()) {
                OrderElem aOrder = (OrderElem)var5.next();
                if (!aFirst) {
                    aQuery.append(" ");
                } else {
                    aFirst = false;
                }

                if (aOrder.isAscending()) {
                    aQuery.append(this.mRenderer.renderValueExpr(aOrder.getExpr()));
                } else {
                    aQuery.append("desc(");
                    aQuery.append(this.mRenderer.renderValueExpr(aOrder.getExpr()));
                    aQuery.append(")");
                }
            }
        }

        if (this.mRenderer.getLimit() != -1L && !(theQuery instanceof ParsedBooleanQuery)) {
            aQuery.append("\nlimit ").append(this.mRenderer.getLimit());
        }

        if (this.mRenderer.getOffset() != -1L) {
            aQuery.append("\noffset ").append(this.mRenderer.getOffset());
        }

        return aQuery.toString();
    }
}
