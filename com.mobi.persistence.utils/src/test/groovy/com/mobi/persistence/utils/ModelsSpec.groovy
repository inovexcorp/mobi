package com.mobi.persistence.utils

import com.mobi.rdf.api.BNode
import com.mobi.rdf.core.impl.sesame.SimpleBNode
import com.mobi.rdf.core.impl.sesame.SimpleIRI
import com.mobi.rdf.core.impl.sesame.SimpleLiteral
import com.mobi.rdf.api.BNode
import com.mobi.rdf.api.IRI
import com.mobi.rdf.api.Literal
import com.mobi.rdf.api.Model
import com.mobi.rdf.api.ModelFactory
import com.mobi.rdf.api.Resource
import com.mobi.rdf.core.impl.sesame.LinkedHashModel
import com.mobi.rdf.core.impl.sesame.SimpleBNode
import com.mobi.rdf.core.impl.sesame.SimpleIRI
import com.mobi.rdf.core.impl.sesame.SimpleLiteral
import spock.lang.Specification


class ModelsSpec extends Specification{

    def "objectString returns object string from only statement in model"(){
        setup:
        Model m = new LinkedHashModel();

/*-
 * #%L
 * com.mobi.persistence.utils
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
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        obj.toString().equals(Models.objectString(m).get());

    }

    def "object returns only object(IRI) in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        obj.equals(Models.object(m).get());
    }

    def "object returns only object(Literal) in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        Literal obj = new SimpleLiteral("test")

        when:
        m.add(sub, pred, obj);

        then:
        obj.equals(Models.object(m).get());
    }

    def "objectIRI returns only object IRI in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        obj.equals(Models.objectIRI(m).get())
    }

    def "objectResource returns only object Resource in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        obj.equals(Models.objectResource(m).get())
    }

    def "objectValue returns only object IRI in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")
        Literal objLit = new SimpleLiteral("test")


        when:
        m.add(sub, pred, obj);
        m.add(sub, pred, objLit)

        then:
        objLit.equals(Models.objectLiteral(m).get())
    }

    def "predicate returns only predicate in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")
        Literal objLit = new SimpleLiteral("test")


        when:
        m.add(sub, pred, obj);
        m.add(sub, pred, objLit)

        then:
        pred.equals(Models.predicate(m).get())
    }

    def "subject returns only subject (IRI) in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        sub.equals(Models.subject(m).get())
    }

    def "subject returns only subject (BNode) in model"(){
        setup:
        Model m = new LinkedHashModel();
        BNode sub = new SimpleBNode("1234");
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        sub.equals(Models.subject(m).get())
    }

    def "subjectBNode returns only subject BNode in model"(){
        setup:
        Model m = new LinkedHashModel();
        BNode sub = new SimpleBNode("1234");
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        sub.equals(Models.subjectBNode(m).get())
    }

    def "subjectIRI returns only subject (IRI) in model"(){
        setup:
        Model m = new LinkedHashModel();
        IRI sub = new SimpleIRI("http://test.com/sub")
        IRI pred = new SimpleIRI("http://test.com/pred")
        IRI obj = new SimpleIRI("http://test.com/obj")

        when:
        m.add(sub, pred, obj);

        then:
        sub.equals(Models.subjectIRI(m).get())
    }

}
